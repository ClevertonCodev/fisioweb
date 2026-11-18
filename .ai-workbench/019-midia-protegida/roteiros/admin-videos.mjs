import { writeFileSync } from 'node:fs';

import { conferir, vigiar } from './_comum.mjs';

export const name = 'admin-videos';
export const baseUrl = 'http://localhost:8000';
export const loginUrl = '/admin/videos';

const NOME = process.env.QA_NOME;

export default async function ({ page, step, shot, url }) {
    const { api, storage } = vigiar(page);

    await step('abrir revisão de exercícios', () => page.goto(url('/admin/exercicios/revisar')));
    await step('o exercício da clínica aparece com capa assinada', async () => {
        await page.getByText(NOME).first().waitFor({ timeout: 20000 });
        await page.locator('img[src*="X-Amz-Signature"]').first().waitFor({ timeout: 15000 });
    });
    await shot('01-revisao');
    await step('o vídeo da revisão toca como blob:', async () => {
        await page.getByRole('button', { name: 'Reproduzir ' + NOME }).first().click({ timeout: 5000 });
        await page.waitForFunction(
            () => [...document.querySelectorAll('video')].some((v) => v.src.startsWith('blob:')),
            null,
            { timeout: 30000 },
        );
    });
    await page.waitForTimeout(1000);
    await shot('02-revisao-tocando');

    await step('abrir lista de vídeos', () => page.goto(url('/admin/videos')));
    await step('a lista mostra capas assinadas', async () => {
        await page.locator('img[src*="X-Amz-Signature"]').first().waitFor({ timeout: 15000 });
    });
    await shot('03-videos');

    await step('a edição do vídeo abre com nome, duração e imagens assinadas', async () => {
        await page.goto(url('/admin/videos/' + process.env.QA_VIDEO_ID + '/editar'));
        const nome = page.getByPlaceholder('nome-do-video.mp4');
        await nome.waitFor({ timeout: 20000 });
        if (!(await nome.inputValue())) throw new Error('o nome do arquivo não veio');
        await page.locator('img[src*="X-Amz-Signature"]').first().waitFor({ timeout: 15000 });
        await nome.fill('qa-editado.mp4');
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await page.waitForTimeout(2500);
        if ((await nome.inputValue()) !== 'qa-editado.mp4') throw new Error('a edição sumiu depois de buscar de novo');
    });
    await shot('04-edicao-video');

    await step('nenhum endereço público nas respostas', async () => {
        writeFileSync(
            new URL('../evidence/correcoes-conferencia/admin-armazenamento.json', import.meta.url),
            JSON.stringify({ storage, api }, null, 2),
        );
        const problemas = conferir(api, storage);
        if (problemas.length) throw new Error(problemas.join(' | '));
    });
}
