#!/usr/bin/env node
/**
 * Roda um fluxo no navegador caçando erro e, com --video, grava o vídeo do bug (skill qa-navegador).
 *
 * Uso (na raiz do fisioweb):
 *   node tools/screenshot/flow.mjs roteiro.json
 *   node tools/screenshot/flow.mjs roteiro.mjs --base http://localhost:8000
 *   node tools/screenshot/flow.mjs roteiro.json --out .ai-workbench/007-x/evidence/002-lista/frontend/criar-paciente --overwrite
 *
 * Opções:
 *   --base URL         base para caminhos relativos (sobrepõe "baseUrl" do roteiro)
 *   --out DIR          pasta de saída (padrão: temporary-screenshots/flows/<data>-<nome>/)
 *   --overwrite        apaga a pasta de saída antes, se já existir
 *   --width N --height N   viewport (padrão 1280×720; celular: 375×812)
 *   --video            grava vídeo + storyboard (só para mostrar um bug; a rodada de QA comum não grava)
 *   --trace            grava trace.zip (abrir com: npx playwright show-trace trace.zip)
 *   --headed --slowmo N    abre o navegador na tela, N ms entre ações
 *   --frame-every S    segundos entre quadros do storyboard (padrão 1)
 *   --dismiss-dialogs  responde "Cancelar" a confirm()/alert() (padrão: aceita)
 *   --read-only        barra toda requisição de escrita (POST/PUT/PATCH/DELETE) e registra o que seria enviado
 *   --allow-remote     permite URL fora do ambiente local; liga --read-only junto
 *
 * Legenda: passo { "caption": "1/3 Texto" } (ou ["texto", ms]) no .json, ou caption(texto, { ms }) no .mjs.
 * Fica no rodapé do vídeo e dos prints, sobrevive à troca de página; caption('') tira.
 *
 * Saída: report.md, report.json, video.webm, storyboard.png, frames/, NN-<rótulo>.png.
 * Código de saída: 0 = fluxo terminou (veja os achados no report.md); 1 = um passo falhou.
 *
 * Login: se o primeiro goto cair em /clinica/login ou /admin/login, entra com o usuário daquele guard
 * em tools/screenshot/credentials.json (ou FISIO_LOGIN/FISIO_SENHA) num contexto sem gravação e
 * reaproveita a sessão (o token fica no localStorage; a senha nunca aparece no vídeo).
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
    assertHttpUrl,
    extractFrames,
    gotoWithLogin,
    isLocalUrl,
    loadPlaywright,
    outDir,
    root,
    slug,
} from './lib.mjs';

const SENSITIVE =
    /senha|password|passwd|token|secret|cvv|card|cartao|cpf|documento/i;
const LARAVEL_ERROR =
    /SQLSTATE\[|Illuminate\\[A-Z]\w*\\|Symfony\\Component\\|ErrorException|Stack trace:|Whoops, looks like something went wrong/;
const BROKEN_TEXT = [
    [/R\$\s*(NaN|undefined|null)/, 'valor monetário quebrado'],
    [/\bundefined\b/, 'undefined'],
    [/\bNaN\b/, 'NaN'],
    [/\[object Object\]/, '[object Object]'],
    [/Invalid date/i, 'Invalid date'],
];

function parseArgs(argv) {
    const args = {
        file: '',
        base: '',
        out: '',
        overwrite: false,
        width: 1280,
        height: 720,
        video: false,
        trace: false,
        headed: false,
        slowmo: 0,
        frameEvery: 1,
        dismissDialogs: false,
        allowRemote: false,
        readOnly: false,
    };
    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        if (token === '--base') args.base = argv[++i];
        else if (token === '--out') args.out = argv[++i];
        else if (token === '--overwrite') args.overwrite = true;
        else if (token === '--width') args.width = Number(argv[++i]);
        else if (token === '--height') args.height = Number(argv[++i]);
        else if (token === '--video') args.video = true;
        else if (token === '--trace') args.trace = true;
        else if (token === '--headed') args.headed = true;
        else if (token === '--slowmo') args.slowmo = Number(argv[++i]);
        else if (token === '--frame-every') args.frameEvery = Number(argv[++i]);
        else if (token === '--dismiss-dialogs') args.dismissDialogs = true;
        else if (token === '--allow-remote')
            args.allowRemote = args.readOnly = true;
        else if (token === '--read-only') args.readOnly = true;
        else if (!args.file) args.file = token;
        else {
            console.error(`Argumento desconhecido: ${token}`);
            process.exit(1);
        }
    }
    return args;
}

function redactUrl(url) {
    try {
        const parsed = new URL(url);
        for (const key of [...parsed.searchParams.keys()]) {
            if (SENSITIVE.test(key)) parsed.searchParams.set(key, '[removido]');
        }
        return parsed.toString();
    } catch {
        return url;
    }
}

// Roda dentro da página: desenha (ou tira) a faixa de legenda no rodapé.
function renderCaption(text) {
    let bar = document.getElementById('__qa-caption');
    if (!text) {
        if (bar) bar.remove();
        return;
    }
    if (!bar) {
        bar = document.createElement('div');
        bar.id = '__qa-caption';
        bar.style.cssText = [
            'position:fixed',
            'left:0',
            'right:0',
            'bottom:0',
            'z-index:2147483647',
            'pointer-events:none',
            'background:rgba(30,30,30,.88)',
            'color:#fff',
            'font:600 18px/1.4 -apple-system,Segoe UI,Roboto,sans-serif',
            'padding:12px 24px',
            'box-shadow:0 -2px 8px rgba(0,0,0,.25)',
        ].join(';');
        (document.body || document.documentElement).appendChild(bar);
    }
    bar.textContent = text;
}

function timestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function loadFlow(file) {
    const abs = path.resolve(file);
    if (!fs.existsSync(abs)) {
        console.error(`Roteiro não encontrado: ${file}`);
        process.exit(1);
    }
    if (abs.endsWith('.json')) {
        const json = JSON.parse(fs.readFileSync(abs, 'utf8'));
        return {
            name: json.name,
            baseUrl: json.baseUrl,
            loginUrl: json.loginUrl,
            viewport: json.viewport,
            steps: json.steps || [],
            run: null,
        };
    }
    const mod = await import(pathToFileURL(abs).href);
    return {
        name: mod.name,
        baseUrl: mod.baseUrl,
        loginUrl: mod.loginUrl,
        viewport: mod.viewport,
        steps: null,
        run: mod.default,
    };
}

function describeJsonStep(step) {
    const [action] = Object.keys(step).filter(
        (k) => !['name', 'optional', 'secret', 'timeout'].includes(k),
    );
    const value = step[action];
    if (step.name) return { action, value, label: step.name };
    let shown = Array.isArray(value) ? value.slice() : value;
    if (
        Array.isArray(shown) &&
        shown.length > 1 &&
        (step.secret || SENSITIVE.test(String(shown[0])))
    ) {
        shown[1] = '***';
    }
    return {
        action,
        value,
        label: `${action} ${Array.isArray(shown) ? shown.join(' → ') : (shown ?? '')}`.trim(),
    };
}

const args = parseArgs(process.argv.slice(2));
if (!args.file) {
    console.error(
        'Uso: node tools/screenshot/flow.mjs <roteiro.json|roteiro.mjs> [--base URL] [--out DIR]',
    );
    process.exit(1);
}

const flow = await loadFlow(args.file);
const flowName = slug(
    flow.name || path.basename(args.file).replace(/\.(json|mjs)$/, ''),
);
const baseUrl = (args.base || flow.baseUrl || '').replace(/\/+$/, '');
const viewport = {
    width: args.width !== 1280 ? args.width : flow.viewport?.width || 1280,
    height: args.height !== 720 ? args.height : flow.viewport?.height || 720,
};
const dest = path.resolve(
    args.out || path.join(outDir, 'flows', `${timestamp()}-${flowName}`),
);

if (path.resolve(args.file).startsWith(dest + path.sep)) {
    console.error(
        'O roteiro não pode ficar dentro da pasta de saída (o --overwrite apagaria o roteiro).',
    );
    process.exit(1);
}
if (fs.existsSync(dest) && fs.readdirSync(dest).length) {
    if (!args.overwrite) {
        console.error(
            `A pasta ${path.relative(root, dest)} já tem arquivos. Use --overwrite para refazer este fluxo.`,
        );
        process.exit(1);
    }
    fs.rmSync(dest, { recursive: true, force: true });
}
fs.mkdirSync(dest, { recursive: true });
fs.copyFileSync(
    path.resolve(args.file),
    path.join(dest, `roteiro${path.extname(args.file)}`),
);

const resolveUrl = (target) => {
    let url = target;
    if (!/^https?:\/\//.test(target)) {
        if (!baseUrl) {
            console.error(
                `Caminho relativo "${target}" sem baseUrl. Passe --base http://...`,
            );
            process.exit(1);
        }
        url = `${baseUrl}${target.startsWith('/') ? '' : '/'}${target}`;
    }
    if (!args.allowRemote && !isLocalUrl(url)) {
        console.error(
            `Recusado: ${url} não é ambiente local. O roteiro pode criar ou apagar dados.`,
        );
        console.error(
            'Se for mesmo intencional (e só leitura), passe --allow-remote.',
        );
        process.exit(1);
    }
    return url;
};

const playwright = loadPlaywright();
const browser = await playwright.chromium.launch({
    headless: !args.headed,
    slowMo: args.slowmo || 0,
});

// Login fora da gravação: a sessão é reaproveitada no contexto gravado.
const firstUrl =
    flow.loginUrl ||
    (flow.steps ? flow.steps.map((s) => s.goto).find(Boolean) : null);
let storageState;
let loggedIn = false;
if (firstUrl || baseUrl) {
    const target = resolveUrl(firstUrl || '/');
    assertHttpUrl(target, 'URL inválida no roteiro.');
    const loginContext = await browser.newContext({ viewport });
    const loginPage = await loginContext.newPage();
    try {
        loggedIn = await gotoWithLogin(loginPage, target);
    } catch (error) {
        console.error(
            `Não consegui abrir ${target}: ${error.message.split('\n')[0]}`,
        );
        console.error('O ambiente local está no ar? Confira a URL e a porta.');
        await browser.close();
        process.exit(1);
    }
    storageState = await loginContext.storageState();
    await loginContext.close();
}

const context = await browser.newContext({
    viewport,
    storageState,
    recordVideo: args.video
        ? { dir: path.join(dest, '.video'), size: viewport }
        : undefined,
});
if (args.trace)
    await context.tracing.start({ screenshots: true, snapshots: true });
const blocked = [];
if (args.readOnly) {
    await context.route('**/*', (route) => {
        const request = route.request();
        if (['GET', 'HEAD', 'OPTIONS'].includes(request.method()))
            return route.continue();
        blocked.push({
            method: request.method(),
            url: redactUrl(request.url()),
            step: currentStep,
        });
        return route.abort('blockedbyclient');
    });
}

let currentCaption = '';
const captions = [];
await context.exposeFunction('__qaCaption', () => currentCaption);
await context.addInitScript(`window.__qaRender = ${renderCaption.toString()};
document.addEventListener('DOMContentLoaded', () => {
  window.__qaCaption && window.__qaCaption().then((t) => t && window.__qaRender(t))
})`);

const started = Date.now();
const since = () => Math.round((Date.now() - started) / 100) / 10;
const findings = [];
const steps = [];
const shots = [];
let currentStep = '(antes do primeiro passo)';
let shotCount = 0;

const addFinding = (kind, message, { key: customKey, ...extra } = {}) => {
    const key = customKey || `${kind}|${message}`;
    const existing = findings.find((f) => f.key === key);
    if (existing) {
        existing.count += 1;
        return;
    }
    findings.push({
        key,
        kind,
        message: message.slice(0, 500),
        step: currentStep,
        t: since(),
        count: 1,
        ...extra,
    });
};

const page = await context.newPage();
page.on('console', (msg) => {
    // 4xx/5xx já entram pelo evento response, com a URL
    if (
        msg.type() === 'error' &&
        !msg.text().startsWith('Failed to load resource')
    )
        addFinding('console.error', msg.text());
    else if (msg.type() === 'warning')
        addFinding('console.warning', msg.text());
});
page.on('pageerror', (error) =>
    addFinding('erro JS', `${error.name}: ${error.message}`),
);
page.on('requestfailed', (request) => {
    const reason = request.failure()?.errorText || 'falhou';
    if (
        reason.includes('ERR_ABORTED') ||
        reason.includes('ERR_BLOCKED_BY_CLIENT')
    )
        return;
    addFinding(
        'requisição falhou',
        `${request.method()} ${redactUrl(request.url())} — ${reason}`,
    );
});
page.on('response', (response) => {
    const status = response.status();
    if (status >= 400 && !response.url().endsWith('/favicon.ico')) {
        addFinding(
            status >= 500 ? 'HTTP 5xx' : 'HTTP 4xx',
            `${status} ${response.request().method()} ${redactUrl(response.url())}`,
        );
    }
});
page.on('dialog', async (dialog) => {
    addFinding('diálogo', `${dialog.type()}: ${dialog.message()}`);
    if (args.dismissDialogs) await dialog.dismiss();
    else await dialog.accept();
});
page.on('framenavigated', (frame) => {
    if (
        frame === page.mainFrame() &&
        !args.allowRemote &&
        /^https?:/.test(frame.url()) &&
        !isLocalUrl(frame.url())
    ) {
        addFinding(
            'saiu do ambiente local',
            `Navegou para ${redactUrl(frame.url())}`,
        );
    }
});
context.on('page', (popup) => {
    if (popup !== page)
        addFinding(
            'nova aba',
            'O fluxo abriu outra aba/janela (não entra no vídeo principal).',
        );
});

async function inspectPage() {
    try {
        const html = await page.evaluate(() => document.body?.innerHTML || '');
        const laravel = html.match(LARAVEL_ERROR);
        if (laravel) {
            const at = html.indexOf(laravel[0]);
            const snippet = html
                .slice(Math.max(0, at - 80), at + 220)
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            addFinding('erro do Laravel na página', snippet, {
                key: `laravel|${laravel[0]}|${snippet.slice(0, 120)}`,
            });
        }
        const text = await page.evaluate(() => {
            const bar = document.getElementById('__qa-caption');
            const all = document.body?.innerText || '';
            return bar ? all.replace(bar.innerText, '') : all;
        });
        let money = false;
        for (const [regex, label] of BROKEN_TEXT) {
            const match = text.match(regex);
            if (label === 'valor monetário quebrado' && match) money = true;
            if (match && !(money && label === 'NaN')) {
                const at = text.indexOf(match[0]);
                addFinding(
                    'texto quebrado na tela',
                    `${label}: "…${text.slice(Math.max(0, at - 60), at + 60).replace(/\s+/g, ' ')}…"`,
                    {
                        key: `texto|${label}`,
                    },
                );
            }
        }
    } catch {
        // página navegando; a próxima inspeção pega
    }
}

async function shot(label) {
    shotCount += 1;
    const file = `${String(shotCount).padStart(2, '0')}-${slug(label) || 'print'}.png`;
    // Print de página inteira redimensiona a tela e aparece encolhido no vídeo
    await page.screenshot({
        path: path.join(dest, file),
        fullPage: !args.video,
    });
    shots.push({ file, label, step: currentStep, t: since() });
    return file;
}

async function caption(text, { ms = 2500 } = {}) {
    currentCaption = text || '';
    if (currentCaption) captions.push({ t: since(), text: currentCaption });
    await page.evaluate(renderCaption, currentCaption).catch(() => {});
    if (currentCaption && ms) await page.waitForTimeout(ms);
}

async function step(name, fn, { optional = false } = {}) {
    currentStep = name;
    const entry = {
        n: steps.length + 1,
        name,
        t: since(),
        status: 'ok',
        ms: 0,
    };
    steps.push(entry);
    const t0 = Date.now();
    try {
        await fn();
        await page
            .waitForLoadState('networkidle', { timeout: 10000 })
            .catch(() => {});
        await inspectPage();
    } catch (error) {
        entry.status = optional ? 'falhou (opcional)' : 'FALHOU';
        entry.error = error.message.split('\n').slice(0, 3).join(' ');
        await shot(`falhou-${name}`).catch(() => {});
        if (!optional) throw error;
    } finally {
        entry.ms = Date.now() - t0;
    }
}

async function runJsonStep(raw) {
    const { action, value, label } = describeJsonStep(raw);
    const timeout = raw.timeout || 10000;
    // role=x[name="..."] vira getByRole (o mesmo dos testes): casa por trecho, sem diferenciar
    // maiúscula, e acha "Nome completo" mesmo com o "*" de obrigatório no rótulo.
    const loc = (selector) => {
        const role = String(selector).match(
            /^role=([\w-]+)\[name=(["'])(.*)\2\]$/,
        );
        return (
            role
                ? page.getByRole(role[1], { name: role[3] })
                : page.locator(selector)
        ).first();
    };
    const pair = (v) => (Array.isArray(v) ? v : [v]);
    const actions = {
        goto: () =>
            page.goto(resolveUrl(value), {
                waitUntil: 'networkidle',
                timeout: 30000,
            }),
        click: () => loc(value).click({ timeout }),
        dblclick: () => loc(value).dblclick({ timeout }),
        hover: () => loc(value).hover({ timeout }),
        fill: () =>
            loc(pair(value)[0]).fill(String(pair(value)[1] ?? ''), { timeout }),
        type: () =>
            loc(pair(value)[0]).pressSequentially(
                String(pair(value)[1] ?? ''),
                { delay: 30, timeout },
            ),
        select: () =>
            loc(pair(value)[0]).selectOption(pair(value)[1], { timeout }),
        check: () => loc(value).check({ timeout }),
        uncheck: () => loc(value).uncheck({ timeout }),
        press: () =>
            Array.isArray(value)
                ? loc(value[0]).press(value[1], { timeout })
                : page.keyboard.press(value),
        upload: () =>
            loc(pair(value)[0]).setInputFiles(
                path.resolve(root, pair(value)[1]),
                { timeout },
            ),
        wait: () => page.waitForTimeout(Number(value)),
        waitFor: () => loc(value).waitFor({ state: 'visible', timeout }),
        waitForUrl: () =>
            page.waitForURL((url) => url.toString().includes(value), {
                timeout,
            }),
        expectVisible: () => loc(value).waitFor({ state: 'visible', timeout }),
        expectHidden: () => loc(value).waitFor({ state: 'hidden', timeout }),
        expectText: () =>
            page
                .getByText(value)
                .first()
                .waitFor({ state: 'visible', timeout }),
        expectNoText: async () => {
            await page.waitForTimeout(300);
            if (await page.getByText(value).first().isVisible())
                throw new Error(`Texto não devia aparecer: "${value}"`);
        },
        expectUrl: async () => {
            if (!page.url().includes(value))
                throw new Error(`URL ${page.url()} não contém "${value}"`);
        },
        eval: () => page.evaluate(value),
        screenshot: () => shot(value),
        caption: () =>
            caption(
                ...(Array.isArray(value)
                    ? [value[0], { ms: value[1] }]
                    : [value]),
            ),
    };
    if (!actions[action])
        throw new Error(
            `Ação desconhecida no roteiro: "${action}". Veja a skill qa-navegador.`,
        );
    await step(label, actions[action], { optional: !!raw.optional });
}

let failed = null;
try {
    if (flow.run) {
        await flow.run({
            page,
            context,
            step,
            shot,
            caption,
            baseUrl,
            url: resolveUrl,
        });
    } else {
        for (const raw of flow.steps) await runJsonStep(raw);
    }
    currentStep = '(final)';
    await page.waitForTimeout(500);
    await inspectPage();
    await shot('final');
} catch (error) {
    failed = error.message.split('\n')[0];
}

const finalUrl = redactUrl(page.url());
if (args.trace)
    await context.tracing.stop({ path: path.join(dest, 'trace.zip') });
const video = page.video();
await context.close();

let storyboard = null;
if (video) {
    const raw = await video.path();
    const videoFile = path.join(dest, 'video.webm');
    fs.renameSync(raw, videoFile);
    fs.rmSync(path.join(dest, '.video'), { recursive: true, force: true });
    try {
        storyboard = await extractFrames(browser, videoFile, dest, {
            every: args.frameEvery,
        });
    } catch (error) {
        console.error(`Storyboard não gerado: ${error.message}`);
    }
}
await browser.close();

const errorKinds = [
    'erro JS',
    'console.error',
    'HTTP 5xx',
    'erro do Laravel na página',
    'requisição falhou',
];
const serious = findings.filter((f) => errorKinds.includes(f.kind));
const report = {
    flow: flowName,
    file: path.relative(root, path.resolve(args.file)),
    baseUrl,
    viewport,
    loggedIn,
    finalUrl,
    result: failed ? 'FALHOU' : 'terminou',
    failure: failed,
    durationSeconds: since(),
    steps,
    shots,
    findings: findings.map(({ key, ...f }) => f),
    video: video ? 'video.webm' : null,
    storyboard: storyboard ? 'storyboard.png' : null,
    trace: args.trace ? 'trace.zip' : null,
    readOnly: args.readOnly,
    blockedWrites: blocked,
    captions,
};
fs.writeFileSync(
    path.join(dest, 'report.json'),
    JSON.stringify(report, null, 2),
);

const md = [];
md.push(`# Fluxo \`${flowName}\``, '');
md.push(`- Resultado: **${report.result}**${failed ? ` — ${failed}` : ''}`);
md.push(
    `- Roteiro: \`${report.file}\` · base \`${baseUrl || '-'}\` · viewport ${viewport.width}×${viewport.height}`,
);
md.push(
    `- Login automático: ${loggedIn ? 'sim (fora do vídeo)' : 'não'} · URL final: \`${finalUrl}\``,
);
if (args.readOnly) {
    md.push(
        `- Somente leitura: ${blocked.length} escrita(s) barrada(s), nada foi gravado`,
    );
    if (blocked.length)
        md.push(
            '- Atenção: erro de rede (ex.: `AxiosError: Network Error`) logo depois de uma escrita barrada é efeito do `--read-only`, não bug da tela',
        );
}
md.push(
    `- Duração: ${report.durationSeconds}s · achados: ${findings.length} (${serious.length} de erro)`,
);
md.push(
    '',
    '## Passos',
    '',
    '| # | t (s) | Passo | Status | ms |',
    '|---|---|---|---|---|',
);
for (const s of steps)
    md.push(
        `| ${s.n} | ${s.t} | ${s.name.replace(/\|/g, '\\|')} | ${s.status}${s.error ? `: ${s.error.replace(/\|/g, '\\|')}` : ''} | ${s.ms} |`,
    );
if (captions.length) {
    md.push('', '## Legendas do vídeo', '');
    for (const c of captions) md.push(`- ${c.t}s — ${c.text}`);
}
md.push('', '## Achados', '');
if (!findings.length)
    md.push(
        'Nenhum erro de console, rede, Laravel ou texto quebrado capturado.',
    );
else {
    md.push(
        '| Tipo | Passo | t (s) | Vezes | Mensagem |',
        '|---|---|---|---|---|',
    );
    for (const f of findings)
        md.push(
            `| ${f.kind} | ${f.step.replace(/\|/g, '\\|')} | ${f.t} | ${f.count} | ${f.message.replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`,
        );
}
if (args.readOnly) {
    md.push('', '## Escritas barradas (--read-only)', '');
    if (!blocked.length) md.push('Nenhuma.');
    for (const b of blocked)
        md.push(`- ${b.method} \`${b.url}\` (passo: ${b.step})`);
}
md.push('', '## Arquivos', '');
md.push(`- \`roteiro${path.extname(args.file)}\` — cópia do roteiro que rodou`);
for (const s of shots)
    md.push(`- \`${s.file}\` — ${s.label} (passo: ${s.step}, ${s.t}s)`);
if (video) md.push('- `video.webm` — gravação do fluxo inteiro');
if (storyboard)
    md.push(
        `- \`storyboard.png\` — ${storyboard.count} quadros do vídeo em grade; quadros soltos em \`frames/\``,
    );
if (args.trace)
    md.push('- `trace.zip` — `npx playwright show-trace trace.zip`');
fs.writeFileSync(path.join(dest, 'report.md'), md.join('\n') + '\n');

const rel = path.relative(root, dest).startsWith('..')
    ? dest
    : path.relative(root, dest);
console.log(`${failed ? 'FALHOU' : 'OK'}  ${rel}/report.md`);
console.log(
    `passos: ${steps.length} · achados: ${findings.length} (${serious.length} de erro)${storyboard ? ` · storyboard: ${rel}/storyboard.png` : ''}`,
);
for (const f of serious.slice(0, 10))
    console.log(`  - [${f.kind}] ${f.message.slice(0, 160)}`);
process.exit(failed ? 1 : 0);
