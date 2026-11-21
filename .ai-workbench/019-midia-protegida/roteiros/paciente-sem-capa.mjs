import { writeFileSync } from 'node:fs';

export const name = 'paciente-sem-capa';
export const baseUrl = 'http://localhost:8000';

const PROGRAMA = process.env.QA_PROGRAMA;

export default async function ({ page, step, shot, url }) {
    const baixados = [];
    page.on('request', (r) => {
        const u = new URL(r.url());
        if (u.hostname.endsWith('r2.cloudflarestorage.com') && u.pathname.endsWith('.mp4')) {
            baixados.push(u.pathname.split('/').pop());
        }
    });
    await page.route('**/api/patient/programs/*', async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        const response = await route.fetch();
        const body = JSON.stringify(await response.json()).replace(/"thumbnail_url":"[^"]*"/g, '"thumbnail_url":null');
        return route.fulfill({ response, body });
    });

    await step('abrir a execução com os exercícios sem capa', async () => {
        await page.goto(url(PROGRAMA + '/executar'));
        await page.locator('video').first().waitFor({ state: 'attached' });
        const capas = await page.locator('video').first().evaluate((v) => v.parentElement.querySelectorAll('img').length);
        if (capas) throw new Error('ainda há capa no player');
    });
    await shot('01-sem-capa-antes-do-play');

    await step('sem capa, o botão de reproduzir aparece e toca o vídeo', async () => {
        const play = page.getByRole('button', { name: /^Reproduzir / }).first();
        if (!(await play.isEnabled())) throw new Error('o botão de reproduzir está desabilitado');
        await play.click({ timeout: 1000 });
        await page.waitForFunction(() => document.querySelector('video')?.src.startsWith('blob:'), null, { timeout: 30000 });
        await page.waitForTimeout(1200);
        const estado = await page.locator('video').first().evaluate((v) => ({
            paused: v.paused,
            visibility: getComputedStyle(v).visibility,
        }));
        if (estado.visibility === 'hidden') throw new Error('o vídeo continua escondido depois do download');
        if (estado.paused) throw new Error('o vídeo não está tocando');
        if (!baixados.length) throw new Error('nenhum download do vídeo');
    });
    await shot('02-sem-capa-tocando');

    writeFileSync(
        new URL('../evidence/correcoes-conferencia/paciente-sem-capa.json', import.meta.url),
        JSON.stringify({ baixados }, null, 2),
    );
}
