import { writeFileSync } from 'node:fs';

import { conferir, preencher, vigiar } from './_comum.mjs';

export const name = 'clinica-envio-e-biblioteca';
export const baseUrl = 'http://localhost:8000';
export const loginUrl = '/clinica/exercicios/enviar';

const NOME = process.env.QA_NOME ?? `QA Midia Protegida ${Date.now()}`;

export default async function ({ page, step, shot, url }) {
    const { api, storage } = vigiar(page);

    await step('abrir envio', () => page.goto(url('/clinica/exercicios/enviar')));
    await step('preencher com vídeo, capa e 2 fotos', () => preencher(page, NOME));
    await step('enviar para o R2 de desenvolvimento', async () => {
        await page.getByRole('button', { name: /Enviar exercício/i }).click();
        await page.getByRole('heading', { name: 'Exercício enviado para revisão' }).waitFor({ timeout: 90000 });
    });
    await shot('01-envio-concluido');

    await step('achar na biblioteca', async () => {
        await page.goto(url('/clinica/exercicios'));
        await page.getByRole('searchbox', { name: 'Pesquisar exercícios' }).fill(NOME);
        await page.getByText('1 exercício encontrado').waitFor({ timeout: 20000 });
    });
    await step('a capa abre por link assinado', async () => {
        const capa = page.locator('img[src*="X-Amz-Signature"]').first();
        await capa.waitFor({ timeout: 15000 });
        const ok = await capa.evaluate((img) => img.complete && img.naturalWidth > 0);
        if (!ok) throw new Error('a capa assinada não carregou');
    });
    await shot('02-biblioteca-capa');

    await step('play baixa e toca como blob:', async () => {
        await page.getByRole('button', { name: `Reproduzir ${NOME}` }).click();
        await page.waitForFunction(() => document.querySelector('video')?.src.startsWith('blob:'), null, { timeout: 30000 });
        const attrs = await page.locator('video').first().evaluate((v) => ({
            controlslist: v.getAttribute('controlslist'),
            src: v.src.slice(0, 5),
        }));
        if (attrs.controlslist !== 'nodownload') throw new Error('sem controlslist=nodownload: ' + JSON.stringify(attrs));
    });
    await page.waitForTimeout(1500);
    await shot('03-tocando-blob');

    await step('link vencido: o player pede outro sozinho e toca', async () => {
        let negados = 0;
        let renovou = false;
        page.on('response', (r) => {
            if (/\/api\/clinic\/exercises\/\d+$/.test(new URL(r.url()).pathname) && r.status() === 200) renovou = true;
        });
        await page.route('**/*r2.cloudflarestorage.com/**', async (route) => {
            if (route.request().method() === 'GET' && negados === 0 && /cloudflarestorage\.com\/videos\//.test(route.request().url())) {
                negados += 1;
                return route.fulfill({
                    status: 403,
                    headers: { 'access-control-allow-origin': '*' },
                    body: '<Error><Code>AccessDenied</Code><Message>Request has expired</Message></Error>',
                });
            }
            return route.continue();
        });
        await page.reload();
        await page.getByRole('searchbox', { name: 'Pesquisar exercícios' }).fill(NOME);
        await page.getByText('1 exercício encontrado').waitFor({ timeout: 20000 });
        await page.getByRole('button', { name: `Reproduzir ${NOME}` }).click();
        await page.waitForFunction(() => document.querySelector('video')?.src.startsWith('blob:'), null, { timeout: 30000 });
        if (negados !== 1) throw new Error('o 403 simulado não foi usado');
        if (!renovou) throw new Error('não pediu o exercício de novo');
        if (await page.getByText('Não foi possível').count()) throw new Error('mostrou erro em vez de renovar');
        await page.unroute('**/*r2.cloudflarestorage.com/**');
    });
    await shot('04-renovado-e-tocando');

    await step('o vídeo sem botão direito', async () => {
        const bloqueado = await page.locator('video').first().evaluate((v) => {
            const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
            return !v.dispatchEvent(e);
        });
        if (!bloqueado) throw new Error('menu de contexto não bloqueado');
    });

    await step('nenhum endereço público nas respostas', async () => {
        const problemas = conferir(api, storage);
        writeFileSync(
            new URL('../evidence/correcoes-conferencia/clinica-armazenamento.json', import.meta.url),
            JSON.stringify({ nome: NOME, storage, api }, null, 2),
        );
        if (problemas.length) throw new Error(problemas.join(' | '));
    });
}
