import { writeFileSync } from 'node:fs';

import { conferir, vigiar } from './_comum.mjs';

export const name = 'paciente-programa';
export const baseUrl = 'http://localhost:8000';

const PROGRAMA = process.env.QA_PROGRAMA;
const SAIDA = process.env.QA_SAIDA ?? 'paciente-armazenamento.json';

export default async function ({ page, step, shot, url }) {
    const { api, storage } = vigiar(page);

    await step('abrir o programa pelo link do QR, sem login', () => page.goto(url(PROGRAMA)));
    await step('a página não usa iframe nem vídeo com link direto', async () => {
        await page.locator('img[src*="X-Amz-Signature"]').first().waitFor({ timeout: 20000 });
        if (await page.locator('iframe').count()) throw new Error('ainda tem iframe');
        const direto = await page.locator('video[src^="http"]').count();
        if (direto) throw new Error(`${direto} <video> com link direto`);
    });
    await shot('01-programa');

    await step('o vídeo do primeiro exercício toca como blob:', async () => {
        await page.getByRole('button', { name: 'Reproduzir' }).first().click();
        await page.waitForFunction(
            () => [...document.querySelectorAll('video')].some((v) => v.src.startsWith('blob:')),
            null,
            { timeout: 30000 },
        );
    });
    await page.waitForTimeout(1500);
    await shot('02-tocando');

    await step('abrir a execução do programa', async () => {
        await page.goto(url(PROGRAMA + '/executar'));
        await page.locator('video').first().waitFor({ state: 'attached' });
        await page.getByRole('button', { name: /^Reproduzir / }).first().click();
        await page.waitForFunction(
            () => [...document.querySelectorAll('video')].some((v) => v.src.startsWith('blob:')) ||
                document.body.innerText.includes('Não foi possível'),
            null,
            { timeout: 30000 },
        );
        if (await page.getByText('Não foi possível').count()) throw new Error('a execução mostrou erro de vídeo');
        if (await page.locator('iframe').count()) throw new Error('a execução ainda tem iframe');
    });
    await page.waitForTimeout(1500);
    await shot('03-execucao');

    await step('nenhum endereço público nas respostas', async () => {
        writeFileSync(
            new URL('../evidence/correcoes-conferencia/' + SAIDA, import.meta.url),
            JSON.stringify({ storage, api }, null, 2),
        );
        const problemas = conferir(api, storage);
        if (problemas.length) throw new Error(problemas.join(' | '));
    });
}
