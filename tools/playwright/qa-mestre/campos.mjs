#!/usr/bin/env node
/**
 * Checagem de campos por tipo, para o modo `quebrar` da skill qa-mestre.
 *
 * Acha sozinho os campos de digitar da tela (ou do modal/drawer aberto), descobre o tipo de cada um
 * (número, percentual, dinheiro, data, máscara, e-mail, texto), digita os valores inválidos do tipo,
 * sai do campo e vê se a tela recusou (limpou, mostrou erro) ou aceitou. Depois devolve o valor original.
 * Não grava nada: depois do login, toda requisição POST/PUT/PATCH/DELETE é barrada e listada.
 *
 * Uso (na raiz do fisioweb):
 *   node tools/playwright/qa-mestre/campos.mjs '<url>' [--click '<seletor>']... [--etapa '<seletor>']...
 *        [--tipo 'Rótulo do campo=percentual']... [--width 1280 --height 720] [--saida arquivo.json]
 *
 *   --click  clique antes de começar (repetível), ex.: abrir o modal: --click 'text=Novo paciente'
 *   --etapa  clique que leva à próxima etapa de um formulário em etapas (repetível); cada etapa é checada
 *   --tipo   corrige o tipo que o script adivinhou: numero, percentual, dinheiro, data, mascara, email, texto
 *   --saida  grava o resultado completo em JSON (a saída na tela traz só o que é suspeito)
 *
 * Login: o mesmo do screenshot.mjs (credentials.json por guard, ou FISIO_LOGIN/FISIO_SENHA).
 */

import fs from 'node:fs';
import {
    assertHttpUrl,
    gotoWithLogin,
    isLocalUrl,
    loadPlaywright,
    outDir,
} from '../lib.mjs';

const ATTEMPTS = {
    numero: ['abc', '-5', '1,5', '99999999999'],
    percentual: ['abc', '-5', '150', '1,5'],
    dinheiro: ['abc', '-10', '10,999'],
    data: ['32/13/2026', 'abc'],
    mascara: ['abcdef', '123'],
    email: ['abc', 'abc@'],
    texto: ['x'.repeat(300), '   '],
};
const TYPES = Object.keys(ATTEMPTS);

function parseArgs(argv) {
    const args = {
        url: '',
        clicks: [],
        steps: [],
        types: {},
        width: 1280,
        height: 720,
        out: '',
    };
    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        if (token === '--click') args.clicks.push(argv[++i]);
        else if (token === '--etapa') args.steps.push(argv[++i]);
        else if (token === '--tipo') {
            const [label, type] = String(argv[++i]).split('=');
            if (!TYPES.includes(type)) {
                console.error(`Tipo "${type}" não existe. Use: ${TYPES.join(', ')}.`);
                process.exit(1);
            }
            args.types[label.trim().toLowerCase()] = type;
        } else if (token === '--width') args.width = Number(argv[++i]);
        else if (token === '--height') args.height = Number(argv[++i]);
        else if (token === '--saida') args.out = argv[++i];
        else args.url = token;
    }
    return args;
}

/** Roda na página: lista os campos de digitar visíveis, com rótulo, pistas de tipo e um seletor estável. */
function discoverFields() {
    const shown = (el) => {
        const box = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return (
            box.width > 0 &&
            box.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden'
        );
    };
    const dialogs = [...document.querySelectorAll('[role="dialog"]')].filter(
        (el) => shown(el) && el.querySelector('input, textarea'),
    );
    const scope = dialogs.length ? dialogs[dialogs.length - 1] : document.body;
    const skip = [
        'hidden',
        'checkbox',
        'radio',
        'file',
        'submit',
        'button',
        'range',
        'color',
        'search',
    ];
    const candidates = [...scope.querySelectorAll('input, textarea')].filter(
        (el) =>
            !skip.includes((el.getAttribute('type') || '').toLowerCase()) &&
            shown(el),
    );
    const fields = candidates.filter((el) => !el.disabled && !el.readOnly);

    const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').replace(/\*$/, '').trim() : '');
    const labelOf = (el) => {
        if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
        const by = el.getAttribute('aria-labelledby');
        if (by) {
            return by
                .split(' ')
                .map((id) => text(document.getElementById(id)))
                .join(' ');
        }
        if (el.id) {
            const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
            if (label) return text(label);
        }
        let node = el.parentElement;
        for (let depth = 0; node && depth < 4; depth += 1, node = node.parentElement) {
            const label = node.querySelector('label');
            if (label && !label.contains(el)) return text(label);
        }
        return el.getAttribute('placeholder') || el.getAttribute('name') || '(sem rótulo)';
    };
    const ownWrapper = (el) => {
        let node = el.parentElement;
        let best = null;
        for (let depth = 0; node && depth < 4; depth += 1, node = node.parentElement) {
            if (node.querySelectorAll('input, textarea, select').length > 1) break;
            best = node;
        }
        return best;
    };
    const hintsOf = (el) => {
        const wrapper = ownWrapper(el);
        return [
            el.getAttribute('type'),
            el.getAttribute('inputmode'),
            el.getAttribute('placeholder'),
            el.getAttribute('name'),
            el.value,
            el.className,
            wrapper ? text(wrapper).slice(0, 40) : '',
        ]
            .filter(Boolean)
            .join(' ');
    };

    return {
        skipped: candidates.filter((el) => el.disabled || el.readOnly).map((el) => labelOf(el)),
        fields: fields.map((el, index) => {
            el.setAttribute('data-qa-campo', String(index));
            return {
                index,
                label: labelOf(el),
                hints: hintsOf(el),
                maxLength: el.maxLength > 0 ? el.maxLength : null,
            };
        }),
    };
}

function guessType(field, overrides) {
    const label = field.label.toLowerCase();
    if (overrides[label]) return overrides[label];
    const all = `${label} ${field.hints}`.toLowerCase();
    if (/type=?"?date|\bdate\b|\bdata\b|nascimento|in[ií]cio|t[eé]rmino|vencimento|\bdd\/mm/.test(all)) return 'data';
    if (/percent|%/.test(all)) return 'percentual';
    if (/r\$|money|dinheiro|pre[çc]o|valor|mensalidade/.test(all)) return 'dinheiro';
    if (/\bcpf\b|cnpj|telefone|celular|whatsapp|\bcep\b|crefito/.test(all)) return 'mascara';
    if (/e-?mail/.test(all)) return 'email';
    if (/\bnumber\b|numeric|decimal|quantidade|s[eé]ries|repeti[çc][õo]es|sess[õo]es|dura[çc][ãa]o|minutos|\bqtd|n[úu]mero|dias\b|idade/.test(all)) return 'numero';
    return 'texto';
}

/** Roda na página: o campo está marcado com erro? Procura no campo e em volta dele. */
function readState(index) {
    const el = document.querySelector(`[data-qa-campo="${index}"]`);
    if (!el) return { gone: true };
    let errorText = '';
    let node = el.parentElement;
    for (let depth = 0; node && depth < 4 && !errorText; depth += 1, node = node.parentElement) {
        const errors = node.querySelectorAll(
            '[role="alert"], [class*="danger"]:not([aria-hidden="true"]), [class*="error"]:not(input)',
        );
        for (const error of errors) {
            const message = error.textContent.replace(/\s+/g, ' ').trim();
            if (message.length > 1) {
                errorText = message.slice(0, 80);
                break;
            }
        }
    }
    const invalid =
        el.getAttribute('aria-invalid') === 'true' ||
        el.matches(':invalid') ||
        Boolean(el.closest('[data-state="error"]'));
    return { value: el.value, invalid, errorText };
}

function verdict(type, attempt, after) {
    if (after.gone) return { suspeito: false, nota: 'o campo sumiu depois de digitar' };
    const refused = after.invalid || Boolean(after.errorText);
    const value = (after.value ?? '').replace(/R\$/g, '');
    const digits = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    const kept = value.trim() !== '' && value.includes(attempt.trim() === '' ? '\u0000' : attempt);
    if (refused) {
        return { suspeito: false, nota: `recusou${after.errorText ? `: "${after.errorText}"` : ''}` };
    }

    if (/[a-z]/i.test(attempt) && ['numero', 'percentual', 'dinheiro', 'mascara', 'data'].includes(type)) {
        return /[a-z]/i.test(value)
            ? { suspeito: true, nota: `"${attempt}" ficou no campo, sem erro` }
            : { suspeito: false, nota: 'limpou as letras' };
    }
    if (attempt.startsWith('-') && value.includes('-')) {
        return { suspeito: true, nota: `negativo "${value}" aceito, sem erro` };
    }
    if (type === 'percentual' && Number(digits) > 100) {
        return { suspeito: true, nota: `${value} aceito, sem erro` };
    }
    if (type === 'data' && kept) {
        return { suspeito: true, nota: `data inválida "${value}" aceita, sem erro` };
    }
    if (type === 'email' && kept) {
        return {
            suspeito: false,
            aviso: true,
            nota: `"${value}" sem erro ao sair do campo (pode validar só ao salvar)`,
        };
    }
    if (type === 'texto' && attempt.length > 100 && value.length >= attempt.length) {
        return {
            suspeito: false,
            aviso: true,
            nota: `aceitou ${value.length} caracteres, sem limite na tela`,
        };
    }
    return { suspeito: false, nota: `ficou "${value.slice(0, 30)}"` };
}

/** A etapa costuma ter o mesmo texto de algo da tela de trás: procura primeiro no modal aberto. */
async function insideOpenPanel(page, selector) {
    const inPanel = page.locator('[role="dialog"]:visible').last().locator(selector);
    return (await inPanel.count()) ? inPanel.first() : page.locator(selector).first();
}

async function checkStage(page, stageName, overrides) {
    const { fields, skipped } = await page.evaluate(discoverFields);
    const results = [];
    for (const field of fields) {
        const type = guessType(field, overrides);
        const input = page.locator(`[data-qa-campo="${field.index}"]`);
        const original = await input.inputValue().catch(() => '');
        for (const attempt of ATTEMPTS[type]) {
            try {
                await input.click({ timeout: 3000 });
                await input.press('ControlOrMeta+a');
                await input.press('Backspace');
                await input.pressSequentially(attempt, { delay: 5 });
                await input.press('Tab');
                await page.waitForTimeout(150);
                const after = await page.evaluate(readState, field.index);
                results.push({
                    etapa: stageName,
                    campo: field.label,
                    tipo: type,
                    tentativa: attempt.length > 20 ? `${attempt.length} caracteres` : attempt,
                    valor: after.value,
                    ...verdict(type, attempt, after),
                });
            } catch (error) {
                results.push({
                    etapa: stageName,
                    campo: field.label,
                    tipo: type,
                    tentativa: attempt,
                    suspeito: false,
                    nota: `não deu para digitar: ${error.message.split('\n')[0]}`,
                });
                break;
            }
        }
        await input.fill(original).catch(() => {});
        await input.press('Tab').catch(() => {});
    }
    return { fields: fields.length, skipped, results };
}

const args = parseArgs(process.argv.slice(2));
assertHttpUrl(
    args.url,
    "Uso: node tools/playwright/qa-mestre/campos.mjs '<url>' [--click ...] [--etapa ...] [--tipo 'Rótulo=tipo'] [--saida arquivo.json]",
);

const playwright = loadPlaywright();
const browser = await playwright.chromium.launch({ headless: true });
const context = await browser.newContext({
    viewport: { width: args.width, height: args.height },
});
const page = await context.newPage();
const blocked = [];
const report = { url: args.url, etapas: [], gravacoesBarradas: blocked };

try {
    await gotoWithLogin(page, args.url);
    await context.route('**/*', (route) => {
        const request = route.request();
        if (['GET', 'HEAD', 'OPTIONS'].includes(request.method())) return route.continue();
        if (isLocalUrl(request.url())) {
            blocked.push(`${request.method()} ${new URL(request.url()).pathname}`);
        }
        return route.abort('blockedbyclient');
    });
    for (const selector of args.clicks) {
        await page.locator(selector).first().click({ timeout: 10000 });
        await page.waitForTimeout(500);
    }
    const stages = ['inicial', ...args.steps];
    for (const [index, stage] of stages.entries()) {
        if (index > 0) {
            await (await insideOpenPanel(page, stage)).click({ timeout: 10000 });
            await page.waitForTimeout(500);
        }
        const name = index === 0 ? 'inicial' : stage.replace(/^text=/, '');
        report.etapas.push({ etapa: name, ...(await checkStage(page, name, args.types)) });
    }
} catch (error) {
    fs.mkdirSync(outDir, { recursive: true });
    const shot = `${outDir}/campos-erro.png`;
    await page.screenshot({ path: shot }).catch(() => {});
    console.error(`${error.message.split('\n')[0]} (tela no momento: ${shot})`);
    process.exitCode = 1;
} finally {
    await browser.close();
}

if (args.out) fs.writeFileSync(args.out, JSON.stringify(report, null, 2));

const all = report.etapas.flatMap((stage) => stage.results);
const flagged = all.filter((row) => row.suspeito || row.aviso);
const lines = ['| Etapa | Campo | Tipo | Tentativa | Resultado |', '|---|---|---|---|---|'];
for (const row of flagged) {
    lines.push(
        `| ${row.etapa} | ${row.campo} | ${row.tipo} | \`${row.tentativa}\` | ${row.suspeito ? '**SUSPEITO**' : 'aviso'}: ${row.nota} |`,
    );
}
const fieldCount = report.etapas.reduce((sum, stage) => sum + stage.fields, 0);
console.log(flagged.length ? lines.join('\n') : 'Nenhum campo aceitou valor inválido sem erro.');
console.log(
    `\n${fieldCount} campos, ${all.length} tentativas, ${all.filter((r) => r.suspeito).length} suspeitos, ${all.filter((r) => r.aviso).length} avisos.`,
);
console.log('Tipos adivinhados: ' + [...new Set(all.map((r) => `${r.campo} = ${r.tipo}`))].join('; '));
const skipped = report.etapas.flatMap((stage) =>
    stage.skipped.map((label) => `${label} (${stage.etapa})`),
);
if (skipped.length) {
    console.log(`Não testados (só abrem por clique ou estão travados): ${skipped.join('; ')}`);
}
if (blocked.length) console.log(`Gravações barradas: ${[...new Set(blocked)].join(', ')}`);
if (process.exitCode) process.exit();
