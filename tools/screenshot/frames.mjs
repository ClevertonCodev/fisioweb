#!/usr/bin/env node
/**
 * Transforma um vídeo em storyboard.png + frames/ para o agente "assistir" lendo PNGs.
 * Não precisa de ffmpeg: decodifica no Chromium do Playwright.
 *
 * Uso (na raiz do fisioweb):
 *   node tools/screenshot/frames.mjs gravacao.webm
 *   node tools/screenshot/frames.mjs ~/Desktop/bug.mov --every 0.5 --max 32 --out temporary-screenshots/bug
 *   node tools/screenshot/frames.mjs video.webm --at 8,17     # só os segundos 8 e 17 (conferir um momento)
 *
 * .webm funciona com o Chromium do Playwright. .mov/.mp4 (gravação de tela do macOS)
 * precisa do Google Chrome instalado (usa channel "chrome").
 */

import fs from 'node:fs';
import path from 'node:path';
import { extractFrames, loadPlaywright, outDir, root, slug } from './lib.mjs';

const argv = process.argv.slice(2);
const opts = { file: '', every: 1, max: 24, out: '', at: null };
for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--every') opts.every = Number(argv[++i]);
    else if (argv[i] === '--max') opts.max = Number(argv[++i]);
    else if (argv[i] === '--out') opts.out = argv[++i];
    else if (argv[i] === '--at')
        opts.at = argv[++i]
            .split(',')
            .map(Number)
            .filter((n) => !Number.isNaN(n));
    else opts.file = argv[i];
}

if (!opts.file || !fs.existsSync(opts.file)) {
    console.error(
        'Uso: node tools/screenshot/frames.mjs <video.webm|.mov|.mp4> [--every S | --at 8,17] [--max N] [--out DIR]',
    );
    process.exit(1);
}

const ext = path.extname(opts.file).toLowerCase();
const dest = path.resolve(
    opts.out ||
        path.join(outDir, 'frames', slug(path.basename(opts.file, ext))),
);
const playwright = loadPlaywright();
const browser = await playwright.chromium.launch({
    headless: true,
    channel: ext === '.webm' ? undefined : 'chrome',
});

try {
    const result = await extractFrames(browser, path.resolve(opts.file), dest, {
        every: opts.every,
        max: opts.max,
        at: opts.at,
    });
    console.log(
        `${path.relative(root, result.storyboard)}  (${result.count} quadros de ${result.duration.toFixed(1)}s)`,
    );
    console.log(`${path.relative(root, result.framesDir)}/`);
} catch (error) {
    console.error(error.message);
    if (ext !== '.webm')
        console.error(
            'Para .mov/.mp4 é preciso o Google Chrome instalado, ou converta para .webm.',
        );
    process.exitCode = 1;
} finally {
    await browser.close();
}
