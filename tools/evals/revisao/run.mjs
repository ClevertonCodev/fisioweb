#!/usr/bin/env node
/**
 * Eval das revisões de código: roda cada revisor em casos com bugs plantados e conta o que ele achou.
 * Experimental e fora do ciclo do harness: nenhuma skill chama este script.
 *
 * Uso (de qualquer pasta do repo):
 *   node tools/evals/revisao/run.mjs
 *   node tools/evals/revisao/run.mjs --casos 01,06
 *   node tools/evals/revisao/run.mjs --paralelo 1 --orcamento 10 --manter
 *
 * Opções:
 *   --casos A,B        prefixos ou nomes das pastas em casos/ (padrão: todos)
 *   --revisores A,B    chaves de REVIEWERS (padrão: todos; hoje só code-review)
 *   --base REF         commit de onde cada worktree nasce (padrão: main)
 *   --paralelo N       quantas revisões rodam ao mesmo tempo (padrão: 2)
 *   --orcamento USD    teto de gasto por sessão do claude, revisor ou juiz (padrão: 20; 0 = sem teto)
 *   --timeout MIN      tempo máximo de cada sessão (padrão: 40)
 *   --manter           não apaga as worktrees no fim (para investigar um caso)
 *   --so-preparar      só monta cada worktree e mostra o diff do caso, sem chamar o claude (custo zero)
 *
 * Como funciona, para cada par (caso, revisor):
 *   1. cria uma worktree temporária, sem branch, a partir de --base;
 *   2. copia o harness do checkout atual (.claude/skills, .claude/agents, AGENTS.md, CLAUDE.md,
 *      docs/ai-harness) e faz um commit local, para avaliar a versão das skills que está no disco
 *      mesmo sem commit, e para esses arquivos não aparecerem no diff revisado;
 *   3. aplica o patch.diff do caso sem commitar: a mudança revisada é o `git diff HEAD`;
 *   4. roda o revisor numa sessão nova do claude, só leitura (modo plan), com a intenção do caso;
 *   5. um juiz, noutra sessão, compara o relatório com os bugs plantados (caso.json) e
 *      classifica os outros achados em real, falso ou nit;
 *   6. apaga a worktree.
 *
 * Saída: tools/evals/revisao/resultados/<data>/ (fora do git) com resumo.md, resumo.json e, por
 * caso, o relatório de cada revisor e a nota do juiz.
 *
 * Custo: cada par são duas sessões do claude (revisor e juiz) e contam no limite de uso da conta.
 */

import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: HERE, encoding: 'utf8' }).trim();
const CASES_DIR = path.join(HERE, 'casos');

// Para comparar outro revisor, acrescente aqui o comando que o chama (uma skill do projeto, por exemplo).
const REVIEWERS = {
    'code-review': '/code-review high',
};

const HARNESS_PATHS = ['.claude/skills', '.claude/agents', '.claude/settings.json', 'AGENTS.md', 'CLAUDE.md', 'docs/ai-harness'];

function parseArgs(argv) {
    const options = {
        cases: null,
        reviewers: Object.keys(REVIEWERS),
        base: 'main',
        parallel: 2,
        budget: 20,
        timeoutMin: 40,
        keep: false,
    };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const next = () => {
            const value = argv[++i];
            if (value === undefined) {
                fail(`Falta o valor de ${arg}`);
            }
            return value;
        };
        if (arg === '--casos') {
            options.cases = next().split(',').map((s) => s.trim()).filter(Boolean);
        } else if (arg === '--revisores') {
            options.reviewers = next().split(',').map((s) => s.trim()).filter(Boolean);
        } else if (arg === '--base') {
            options.base = next();
        } else if (arg === '--paralelo') {
            options.parallel = Math.max(1, Number(next()) || 1);
        } else if (arg === '--orcamento') {
            options.budget = Number(next());
        } else if (arg === '--timeout') {
            options.timeoutMin = Number(next()) || 40;
        } else if (arg === '--manter') {
            options.keep = true;
        } else if (arg === '--so-preparar') {
            options.prepareOnly = true;
        } else if (arg === '-h' || arg === '--help') {
            const header = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0];
            console.log(header.replace(/^#!.*\n\/\*\*\n?/, '').replace(/^ \* ?/gm, ''));
            process.exit(0);
        } else {
            fail(`Opção desconhecida: ${arg} (use --help)`);
        }
    }
    for (const reviewer of options.reviewers) {
        if (!REVIEWERS[reviewer]) {
            fail(`Revisor desconhecido: ${reviewer} (use ${Object.keys(REVIEWERS).join(', ')})`);
        }
    }
    return options;
}

function fail(message) {
    console.error(`FALHOU: ${message}`);
    process.exit(2);
}

function git(cwd, args, extra = {}) {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...extra });
}

function loadCases(filter) {
    if (!fs.existsSync(CASES_DIR)) {
        fail(`Não achei ${path.relative(ROOT, CASES_DIR)}`);
    }
    const names = fs
        .readdirSync(CASES_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
    const selected = filter ? names.filter((name) => filter.some((f) => name === f || name.startsWith(f))) : names;
    if (selected.length === 0) {
        fail('Nenhum caso selecionado');
    }
    return selected.map((name) => {
        const dir = path.join(CASES_DIR, name);
        const meta = JSON.parse(fs.readFileSync(path.join(dir, 'caso.json'), 'utf8'));
        const patch = path.join(dir, 'patch.diff');
        if (!fs.existsSync(patch)) {
            fail(`Caso ${name} sem patch.diff`);
        }
        return { name, dir, patch, meta };
    });
}

function timestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

const activeWorktrees = new Set();

function removeWorktree(dir) {
    try {
        git(ROOT, ['worktree', 'remove', '--force', dir]);
    } catch {
        fs.rmSync(dir, { recursive: true, force: true });
        try {
            git(ROOT, ['worktree', 'prune']);
        } catch {
            // nada a fazer: a pasta já foi apagada
        }
    }
    activeWorktrees.delete(dir);
}

function prepareWorktree(dir, base, patch) {
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    git(ROOT, ['worktree', 'add', '--detach', dir, base]);
    activeWorktrees.add(dir);

    for (const rel of HARNESS_PATHS) {
        const from = path.join(ROOT, rel);
        const to = path.join(dir, rel);
        fs.rmSync(to, { recursive: true, force: true });
        if (fs.existsSync(from)) {
            fs.mkdirSync(path.dirname(to), { recursive: true });
            fs.cpSync(from, to, { recursive: true });
        }
    }
    git(dir, ['add', '-A']);
    if (git(dir, ['status', '--porcelain']).trim() !== '') {
        git(dir, ['-c', 'user.name=eval', '-c', 'user.email=eval@localhost', 'commit', '--no-verify', '-q', '-m', 'eval: harness do checkout atual']);
    }

    git(dir, ['apply', '--index', patch]);
}

function runClaude(cwd, prompt, { appendSystemPrompt, budget, timeoutMin }) {
    const args = ['-p', prompt, '--permission-mode', 'plan', '--output-format', 'json', '--no-session-persistence', '--strict-mcp-config'];
    if (budget > 0) {
        args.push('--max-budget-usd', String(budget));
    }
    if (appendSystemPrompt) {
        args.push('--append-system-prompt', appendSystemPrompt);
    }
    return new Promise((resolve) => {
        const started = Date.now();
        const child = spawn('claude', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk) => (stdout += chunk));
        child.stderr.on('data', (chunk) => (stderr += chunk));
        const timer = setTimeout(() => child.kill('SIGTERM'), timeoutMin * 60_000);
        child.on('close', (code, signal) => {
            clearTimeout(timer);
            const elapsedMs = Date.now() - started;
            let parsed = null;
            try {
                parsed = JSON.parse(stdout);
            } catch {
                // saída que não é JSON: tratada como falha abaixo
            }
            const text = parsed?.result ?? '';
            const ok = code === 0 && parsed && !parsed.is_error && text.trim() !== '';
            resolve({
                ok,
                text,
                costUsd: parsed?.total_cost_usd ?? null,
                durationMs: parsed?.duration_ms ?? elapsedMs,
                error: ok ? null : (signal ? `encerrada por ${signal} (timeout?)` : `código ${code}`) + (stderr.trim() ? `: ${stderr.trim().slice(-500)}` : parsed?.subtype ? `: ${parsed.subtype}` : ''),
                raw: stdout,
            });
        });
    });
}

function reviewerContext(meta) {
    return [
        'Execução automática de um eval, sem ninguém para responder.',
        'Não faça perguntas: decida sozinho e siga até o relatório final.',
        'A mudança a revisar é a que está pendente no working tree (`git diff HEAD`), sobre o commit atual.',
        `Intenção da mudança, como na descrição de um PR: ${meta.intencao}`,
    ].join(' ');
}

function judgePrompt(meta, report) {
    return `Você é o juiz de um eval de revisão de código. Não edite nenhum arquivo.

A mudança revisada é o \`git diff HEAD\` deste repositório. Nela foram plantados, de propósito, os bugs abaixo:

${JSON.stringify(meta.bugs, null, 2)}

Este é o relatório que um revisor escreveu sobre a mudança:

<relatorio>
${report}
</relatorio>

Faça duas coisas:

1. Para cada bug plantado, diga se o relatório o encontrou. Conta como encontrado só se o relatório aponta o mesmo defeito (o critério está em "como_reconhecer"), mesmo com outras palavras ou outra gravidade. Citar o arquivo sem apontar o defeito não conta.
2. Classifique cada um dos outros achados do relatório (os que não são um bug plantado):
   - "real": defeito de verdade. Confira no código (\`git diff HEAD\` e leitura dos arquivos) antes de decidir.
   - "falso": não é problema (o código já trata o caso, ou a afirmação está errada).
   - "nit": estilo ou preferência, sem defeito.

Responda SÓ com um objeto JSON, sem texto antes ou depois, neste formato:
{"bugs":[{"id":"B1","encontrado":true,"gravidade_dada":"blocker|ajustar|nit|-","trecho":"frase curta do relatório que mostra o achado, ou vazio"}],"outros_achados":[{"resumo":"uma frase","classe":"real|falso|nit","motivo":"uma frase"}],"veredito_do_revisor":"o veredito que o relatório deu, ou -"}`;
}

function extractJson(text) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) {
        return null;
    }
    try {
        return JSON.parse(text.slice(start, end + 1));
    } catch {
        return null;
    }
}

async function runJob(job, options, runDir, runTmp) {
    const { kase, reviewer } = job;
    const caseOut = path.join(runDir, kase.name);
    fs.mkdirSync(caseOut, { recursive: true });
    const worktree = path.join(runTmp, `${kase.name}--${reviewer}`);
    const result = { caso: kase.name, revisor: reviewer, totalBugs: kase.meta.bugs.length };
    const label = `${kase.name} · ${reviewer}`;

    try {
        prepareWorktree(worktree, options.base, kase.patch);
    } catch (error) {
        result.falhou = `não consegui preparar a worktree: ${String(error.stderr || error.message).trim()}`;
        console.log(`✗ ${label}: ${result.falhou}`);
        if (!options.keep && activeWorktrees.has(worktree)) {
            removeWorktree(worktree);
        }
        return result;
    }

    try {
        console.log(`▶ ${label}: revisando`);
        const review = await runClaude(worktree, REVIEWERS[reviewer], {
            appendSystemPrompt: reviewerContext(kase.meta),
            budget: options.budget,
            timeoutMin: options.timeoutMin,
        });
        fs.writeFileSync(path.join(caseOut, `${reviewer}.bruto.json`), review.raw);
        result.custoUsd = review.costUsd;
        result.tempoMs = review.durationMs;
        if (!review.ok) {
            result.falhou = `revisor: ${review.error}`;
            console.log(`✗ ${label}: ${result.falhou}`);
            return result;
        }
        fs.writeFileSync(path.join(caseOut, `${reviewer}.md`), review.text);

        console.log(`▶ ${label}: julgando`);
        const judge = await runClaude(worktree, judgePrompt(kase.meta, review.text), {
            budget: options.budget,
            timeoutMin: options.timeoutMin,
        });
        result.custoJuizUsd = judge.costUsd;
        const grade = judge.ok ? extractJson(judge.text) : null;
        if (!grade || !Array.isArray(grade.bugs)) {
            fs.writeFileSync(path.join(caseOut, `${reviewer}.juiz.bruto.txt`), judge.raw || judge.text);
            result.falhou = `juiz: ${judge.ok ? 'não devolveu o JSON esperado' : judge.error}`;
            console.log(`✗ ${label}: ${result.falhou}`);
            return result;
        }
        fs.writeFileSync(path.join(caseOut, `${reviewer}.nota.json`), JSON.stringify(grade, null, 2));

        const others = Array.isArray(grade.outros_achados) ? grade.outros_achados : [];
        result.achados = grade.bugs.filter((b) => b.encontrado).map((b) => b.id);
        result.perdidos = kase.meta.bugs.filter((b) => !result.achados.includes(b.id)).map((b) => ({ id: b.id, descricao: b.descricao }));
        result.falsos = others.filter((o) => o.classe === 'falso');
        result.reais = others.filter((o) => o.classe === 'real');
        result.nits = others.filter((o) => o.classe === 'nit').length;
        result.veredito = grade.veredito_do_revisor ?? '-';
        console.log(`✓ ${label}: ${result.achados.length}/${result.totalBugs} bugs · ${result.falsos.length} falsos · ${result.reais.length} reais extras`);
        return result;
    } finally {
        if (!options.keep) {
            removeWorktree(worktree);
        }
    }
}

async function runPool(jobs, size, worker) {
    const results = [];
    let next = 0;
    async function lane() {
        while (next < jobs.length) {
            const index = next++;
            results[index] = await worker(jobs[index]);
        }
    }
    await Promise.all(Array.from({ length: Math.min(size, jobs.length) }, lane));
    return results;
}

function money(value) {
    return typeof value === 'number' ? `US$ ${value.toFixed(2)}` : '-';
}

function minutes(ms) {
    return typeof ms === 'number' ? `${(ms / 60_000).toFixed(1)} min` : '-';
}

function writeSummary(runDir, options, baseSha, results) {
    const lines = [];
    lines.push(`# Eval das revisões · ${path.basename(runDir)}`, '');
    lines.push(`Base: \`${options.base}\` (${baseSha}) com o harness do checkout atual · revisores: ${options.reviewers.join(', ')} · 1 rodada por caso`, '');

    lines.push('## Por revisor', '');
    lines.push('| Revisor | Bugs achados | Falsos positivos | Reais extras | Nits | Custo (revisor) | Tempo médio | Falhas |');
    lines.push('|---|---|---|---|---|---|---|---|');
    for (const reviewer of options.reviewers) {
        const mine = results.filter((r) => r.revisor === reviewer);
        const graded = mine.filter((r) => !r.falhou);
        const found = graded.reduce((sum, r) => sum + r.achados.length, 0);
        const total = graded.reduce((sum, r) => sum + r.totalBugs, 0);
        const falsos = graded.reduce((sum, r) => sum + r.falsos.length, 0);
        const reais = graded.reduce((sum, r) => sum + r.reais.length, 0);
        const nits = graded.reduce((sum, r) => sum + r.nits, 0);
        const cost = mine.reduce((sum, r) => sum + (r.custoUsd ?? 0), 0);
        const timed = mine.filter((r) => typeof r.tempoMs === 'number');
        const avg = timed.length ? timed.reduce((sum, r) => sum + r.tempoMs, 0) / timed.length : null;
        lines.push(`| ${reviewer} | ${found}/${total} | ${falsos} | ${reais} | ${nits} | ${money(cost)} | ${minutes(avg)} | ${mine.length - graded.length} |`);
    }
    const judgeCost = results.reduce((sum, r) => sum + (r.custoJuizUsd ?? 0), 0);
    lines.push('', `Custo do juiz, somado: ${money(judgeCost)}.`, '');

    lines.push('## Por caso', '');
    lines.push('| Caso | Revisor | Achados | Perdidos | Falsos | Reais extras | Veredito | Custo | Tempo |');
    lines.push('|---|---|---|---|---|---|---|---|---|');
    for (const r of results) {
        if (r.falhou) {
            lines.push(`| ${r.caso} | ${r.revisor} | FALHOU: ${r.falhou.replace(/\|/g, '/').slice(0, 120)} | | | | | ${money(r.custoUsd)} | ${minutes(r.tempoMs)} |`);
            continue;
        }
        lines.push(`| ${r.caso} | ${r.revisor} | ${r.achados.length}/${r.totalBugs} | ${r.perdidos.map((p) => p.id).join(', ') || '-'} | ${r.falsos.length} | ${r.reais.length} | ${r.veredito} | ${money(r.custoUsd)} | ${minutes(r.tempoMs)} |`);
    }

    const missed = results.filter((r) => !r.falhou && r.perdidos.length);
    if (missed.length) {
        lines.push('', '## Bugs perdidos', '');
        for (const r of missed) {
            for (const p of r.perdidos) {
                lines.push(`- **${r.caso} · ${r.revisor} · ${p.id}:** ${p.descricao}`);
            }
        }
    }

    const noisy = results.filter((r) => !r.falhou && r.falsos.length);
    if (noisy.length) {
        lines.push('', '## Falsos positivos', '');
        for (const r of noisy) {
            for (const f of r.falsos) {
                lines.push(`- **${r.caso} · ${r.revisor}:** ${f.resumo} (${f.motivo})`);
            }
        }
    }

    lines.push('', 'Relatórios e notas do juiz por caso nas pastas ao lado. O juiz também é um modelo: confira os casos que parecerem estranhos.');
    fs.writeFileSync(path.join(runDir, 'resumo.md'), lines.join('\n') + '\n');
    fs.writeFileSync(path.join(runDir, 'resumo.json'), JSON.stringify({ base: options.base, baseSha, reviewers: options.reviewers, results }, null, 2));
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    try {
        execFileSync('claude', ['--version'], { stdio: 'ignore' });
    } catch {
        fail('o CLI do Claude Code (claude) não está instalado nesta máquina');
    }
    let baseSha;
    try {
        baseSha = git(ROOT, ['rev-parse', '--short', options.base]).trim();
    } catch {
        fail(`não achei a base ${options.base}`);
    }

    const cases = loadCases(options.cases);
    const stamp = timestamp();
    const runDir = path.join(HERE, 'resultados', stamp);
    const runTmp = path.join(os.tmpdir(), 'fisioweb-evals', stamp);
    fs.mkdirSync(runDir, { recursive: true });

    const cleanup = () => {
        if (!options.keep) {
            for (const dir of [...activeWorktrees]) {
                removeWorktree(dir);
            }
        }
    };
    process.on('SIGINT', () => {
        console.log('\nInterrompido: apagando as worktrees.');
        cleanup();
        process.exit(130);
    });

    const jobs = cases.flatMap((kase) => options.reviewers.map((reviewer) => ({ kase, reviewer })));
    if (!options.prepareOnly) {
        console.log(`${jobs.length} revisões (${cases.length} casos × ${options.reviewers.length} revisores), ${options.parallel} por vez. Cada uma pode levar vários minutos.`);
    }

    if (options.prepareOnly) {
        for (const kase of cases) {
            const worktree = path.join(runTmp, kase.name);
            try {
                prepareWorktree(worktree, options.base, kase.patch);
                const stat = git(worktree, ['diff', 'HEAD', '--stat']).trim().split('\n').pop();
                const harness = git(worktree, ['log', '--oneline', `${options.base}..HEAD`]).trim() || 'nenhum (harness igual à base)';
                console.log(`✓ ${kase.name}: ${stat} · commit do harness: ${harness} · ${kase.meta.bugs.length} bugs plantados`);
            } catch (error) {
                console.log(`✗ ${kase.name}: ${String(error.stderr || error.message).trim()}`);
            } finally {
                if (activeWorktrees.has(worktree)) {
                    removeWorktree(worktree);
                }
            }
        }
        fs.rmSync(runTmp, { recursive: true, force: true });
        fs.rmSync(runDir, { recursive: true, force: true });
        return;
    }

    const results = await runPool(jobs, options.parallel, (job) => runJob(job, options, runDir, runTmp));
    cleanup();
    if (!options.keep) {
        fs.rmSync(runTmp, { recursive: true, force: true });
    }

    writeSummary(runDir, options, baseSha, results);
    console.log(`\nPronto: ${path.relative(ROOT, path.join(runDir, 'resumo.md'))}`);
    if (options.keep) {
        console.log(`Worktrees mantidas em ${runTmp} (apague com: git worktree remove --force <pasta>)`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
