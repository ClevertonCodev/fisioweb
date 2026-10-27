#!/usr/bin/env node
/**
 * Print de localhost num Chromium headless, para qualquer agente (Claude Code, Cursor).
 *
 * Uso (na raiz do fisioweb):
 *   node tools/screenshot/screenshot.mjs 'http://localhost:8000/design-system' reference
 *   node tools/screenshot/screenshot.mjs 'http://localhost:8000/clinica/pacientes' impl
 *
 * Viewport (opcional):
 *   node tools/screenshot/screenshot.mjs URL label --width 1280 --height 720
 *
 * Saída: temporary-screenshots/screenshot-N[-label].png (nunca sobrescreve)
 * Depois: o agente lê o PNG com a ferramenta de Read.
 * Login: se cair em /clinica/login ou /admin/login, entra com tools/screenshot/credentials.json.
 *
 * Fluxo com vídeo, console e rede: tools/screenshot/flow.mjs (skill qa-navegador).
 */

import fs from 'node:fs';
import path from 'node:path';
import {
    assertHttpUrl,
    gotoWithLogin,
    loadPlaywright,
    outDir,
    root,
} from './lib.mjs';

function parseArgs(argv) {
    const args = { url: '', label: '', width: 1280, height: 720 };
    const rest = [];
    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        if (token === '--width') {
            args.width = Number(argv[++i]);
        } else if (token === '--height') {
            args.height = Number(argv[++i]);
        } else {
            rest.push(token);
        }
    }
    args.url = rest[0] || '';
    args.label = (rest[1] || '').replace(/[^a-zA-Z0-9_-]/g, '');
    return args;
}

function nextFile(label) {
    fs.mkdirSync(outDir, { recursive: true });
    const existing = fs
        .readdirSync(outDir)
        .filter((name) => /^screenshot-\d+/.test(name));
    const nums = existing.map((name) =>
        Number((name.match(/^screenshot-(\d+)/) || [])[1] || 0),
    );
    const n = (nums.length ? Math.max(...nums) : 0) + 1;
    const suffix = label ? `-${label}` : '';
    return path.join(outDir, `screenshot-${n}${suffix}.png`);
}

const args = parseArgs(process.argv.slice(2));

assertHttpUrl(
    args.url,
    'Uso: node tools/screenshot/screenshot.mjs http://localhost:PORT/path [label]',
);

const playwright = loadPlaywright();
const dest = nextFile(args.label);
const browser = await playwright.chromium.launch({ headless: true });
const context = await browser.newContext({
    viewport: { width: args.width, height: args.height },
});
const page = await context.newPage();

try {
    await gotoWithLogin(page, args.url);
    await page.waitForTimeout(600);
    await page.screenshot({ path: dest, fullPage: true });
} catch (error) {
    console.error(error.message.split('\n')[0]);
    process.exitCode = 1;
} finally {
    await browser.close();
}
if (process.exitCode) process.exit();

console.log(path.relative(root, dest));
