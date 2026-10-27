/**
 * Funções compartilhadas por screenshot.mjs, flow.mjs e frames.mjs.
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../..',
);
export const outDir = path.join(root, 'temporary-screenshots');

const credentialsFile = path.join(root, 'tools/screenshot/credentials.json');
const localPlaywright = path.join(
    root,
    'tools/screenshot/node_modules/playwright',
);

// Áreas do SPA: o guard sai do caminho da URL. O token fica em localStorage
// auth_token_<guard> (resources/js/infrastructure/api/client.ts).
const AREAS = [
    { guard: 'clinic', prefix: '/clinica', login: '/clinica/login' },
    { guard: 'admin', prefix: '/admin', login: '/admin/login' },
];

export function loadPlaywright() {
    const require = createRequire(import.meta.url);
    for (const candidate of [localPlaywright, 'playwright']) {
        try {
            return require(candidate);
        } catch {
            // try next
        }
    }
    console.error('Playwright não encontrado. Na raiz do repo:');
    console.error('  cd tools/screenshot && npm install');
    process.exit(1);
}

/**
 * credentials.json tem um usuário por guard ({ clinic: {email, password}, admin: {...} }).
 * FISIO_LOGIN/FISIO_SENHA no ambiente têm prioridade (testar outra clínica ou outro papel).
 */
export function loadCredentials(guard) {
    const file = fs.existsSync(credentialsFile)
        ? JSON.parse(fs.readFileSync(credentialsFile, 'utf8'))
        : {};
    const email = process.env.FISIO_LOGIN || file[guard]?.email;
    const password = process.env.FISIO_SENHA || file[guard]?.password;
    return email && password ? { email, password } : null;
}

function pathOf(url) {
    try {
        return new URL(url).pathname.replace(/\/+$/, '') || '/';
    } catch {
        return '';
    }
}

/** Guard da tela de login que a URL é, ou null. */
export function loginGuard(url) {
    const pathname = pathOf(url);
    return AREAS.find((area) => pathname === area.login)?.guard || null;
}

/** Guard da área (clínica ou admin) a que a URL pertence, ou null. */
export function areaGuard(url) {
    const pathname = pathOf(url);
    return (
        AREAS.find(
            (area) =>
                pathname === area.prefix ||
                pathname.startsWith(`${area.prefix}/`),
        )?.guard || null
    );
}

export function assertHttpUrl(url, usage) {
    if (!url || !/^https?:\/\//.test(url)) {
        console.error(usage);
        console.error('Só aceita http:// ou https:// — nunca file:///');
        process.exit(1);
    }
}

/**
 * Abre a URL e, se ela for da área da clínica ou do admin sem token daquele guard (ou o SPA
 * mandar para o login), entra com o usuário do guard em tools/screenshot/credentials.json e
 * volta para a URL. Devolve true se precisou logar. Pedir a própria tela de login não loga.
 */
export async function gotoWithLogin(page, url) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    // Nunca mandar credencial para fora do ambiente local.
    if (isLocalUrl(url) && !isLocalUrl(page.url())) {
        throw new Error(
            `Redirecionou para fora do ambiente local (${new URL(page.url()).origin}). Parei sem logar.`,
        );
    }
    if (loginGuard(url)) {
        return false;
    }
    // Algumas telas abrem sem token e só caem no login quando a API responde 401.
    let guard = loginGuard(page.url());
    if (!guard) {
        const area = areaGuard(url);
        const hasToken =
            area &&
            (await page.evaluate(
                (g) => !!localStorage.getItem(`auth_token_${g}`),
                area,
            ));
        if (!area || hasToken) {
            return false;
        }
        guard = area;
        const login = AREAS.find((a) => a.guard === guard).login;
        await page.goto(new URL(login, url).toString(), {
            waitUntil: 'networkidle',
            timeout: 30000,
        });
    }
    const credentials = loadCredentials(guard);
    if (!credentials) {
        console.error(
            `Caiu no login (${guard}) sem credencial: preencha "${guard}" em tools/screenshot/credentials.json ou FISIO_LOGIN/FISIO_SENHA.`,
        );
        process.exit(1);
    }
    await page.locator('input[type="email"]').first().fill(credentials.email);
    await page
        .locator('input[type="password"]')
        .first()
        .fill(credentials.password);
    await page.locator('button[type="submit"]').first().click();
    try {
        await page.waitForURL((current) => !loginGuard(current.toString()), {
            timeout: 15000,
        });
    } catch {
        throw new Error(
            `O login (${guard}) não saiu da tela de login: e-mail ou senha errados, ou usuário inativo.`,
        );
    }
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    return true;
}

export function isLocalUrl(url) {
    try {
        const host = new URL(url).hostname;
        return (
            /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(
                host,
            ) || /\.(localhost|test|local)$/.test(host)
        );
    } catch {
        return false;
    }
}

export function slug(text) {
    return String(text || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
}

/**
 * Extrai quadros de um vídeo usando o próprio Chromium (não precisa de ffmpeg) e monta
 * um storyboard: um PNG com todos os quadros em grade e o tempo de cada um.
 * Chromium do Playwright só decodifica .webm; para .mov/.mp4 passe channel 'chrome'.
 */
export async function extractFrames(
    browser,
    videoPath,
    destDir,
    { every = 1, max = 24, columns = 4, write = true, at = null } = {},
) {
    const context = await browser.newContext({
        viewport: { width: 1600, height: 900 },
    });
    const page = await context.newPage();
    const ext = path.extname(videoPath).toLowerCase();
    const mime =
        {
            '.webm': 'video/webm',
            '.mp4': 'video/mp4',
            '.mov': 'video/mp4',
            '.m4v': 'video/mp4',
        }[ext] || 'video/webm';
    const base64 = fs.readFileSync(videoPath).toString('base64');

    await page.setContent(
        '<!doctype html><body style="margin:0;background:#111;color:#eee;font:14px sans-serif"></body>',
    );
    const frames = await page.evaluate(
        async ({ base64, mime, every, max, at }) => {
            const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
            const video = document.createElement('video');
            video.muted = true;
            video.src = URL.createObjectURL(new Blob([bytes], { type: mime }));
            await new Promise((resolve, reject) => {
                video.onloadedmetadata = resolve;
                video.onerror = () =>
                    reject(
                        new Error(
                            'Não consegui decodificar o vídeo (' + mime + ').',
                        ),
                    );
            });
            const seek = (t) =>
                new Promise((resolve) => {
                    video.onseeked = resolve;
                    video.currentTime = t;
                });
            if (!Number.isFinite(video.duration)) {
                await seek(1e7);
                await seek(0);
            }
            const duration = video.duration;
            let times = [];
            if (at) {
                times = at.map((t) =>
                    Math.min(Math.max(0, t), Math.max(0, duration - 0.05)),
                );
            } else {
                for (let t = 0; t < duration; t += every) times.push(t);
                times.push(Math.max(0, duration - 0.05));
            }
            if (!at && times.length > max) {
                const step = (times.length - 1) / (max - 1);
                times = Array.from(
                    { length: max },
                    (_, i) => times[Math.round(i * step)],
                );
            }
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            const result = [];
            for (const t of times) {
                await seek(t);
                ctx.drawImage(video, 0, 0);
                result.push({
                    t: Math.round(t * 10) / 10,
                    dataUrl: canvas.toDataURL('image/png'),
                });
            }
            return { duration, frames: result };
        },
        { base64, mime, every, max, at },
    );

    fs.mkdirSync(destDir, { recursive: true });
    const framesDir = path.join(destDir, 'frames');
    if (write) {
        fs.mkdirSync(framesDir, { recursive: true });
        frames.frames.forEach((frame, i) => {
            const name = `${String(i + 1).padStart(2, '0')}-${frame.t.toFixed(1)}s.png`;
            fs.writeFileSync(
                path.join(framesDir, name),
                Buffer.from(frame.dataUrl.split(',')[1], 'base64'),
            );
        });
    }

    await page.evaluate(
        ({ frames, columns }) => {
            document.body.innerHTML = '';
            const grid = document.createElement('div');
            grid.id = 'grid';
            grid.style.cssText = `display:grid;grid-template-columns:repeat(${columns},1fr);gap:8px;padding:8px;width:1584px`;
            for (const frame of frames) {
                const cell = document.createElement('figure');
                cell.style.cssText = 'margin:0;background:#222;padding:4px';
                cell.innerHTML = `<img src="${frame.dataUrl}" style="width:100%;display:block"><figcaption style="padding:4px 2px">${frame.t.toFixed(1)}s</figcaption>`;
                grid.appendChild(cell);
            }
            document.body.appendChild(grid);
        },
        { frames: frames.frames, columns },
    );
    await page.waitForTimeout(200);
    const storyboard = path.join(destDir, 'storyboard.png');
    await page.locator('#grid').screenshot({ path: storyboard });
    await context.close();

    return {
        duration: frames.duration,
        count: frames.frames.length,
        storyboard,
        framesDir: write ? framesDir : null,
    };
}
