import { writeFileSync } from 'node:fs';

import { FIX } from './_comum.mjs';

export const name = 'clinica-trocar-imagens';
export const baseUrl = 'http://localhost:8000';
export const loginUrl = '/clinica/exercicios';

const NOME = process.env.QA_NOME;

export default async function ({ page, step, shot, url }) {
    let envio = null;
    page.on('request', (r) => {
        if (r.method() === 'PUT' && /\/api\/clinic\/media\/videos\/\d+\/reference-images$/.test(new URL(r.url()).pathname)) {
            envio = { body: r.postDataJSON(), status: null };
            r.response().then((res) => {
                envio.status = res?.status() ?? null;
            });
        }
    });

    await step('abrir o exercício de QA na biblioteca', async () => {
        await page.goto(url('/clinica/exercicios'));
        await page.getByRole('searchbox', { name: 'Pesquisar exercícios' }).fill(NOME);
        await page.getByText('1 exercício encontrado').waitFor({ timeout: 20000 });
        await page
            .getByRole('button', { name: 'Reproduzir ' + NOME })
            .locator('..')
            .click({ position: { x: 40, y: 180 } });
        await page.getByRole('button', { name: 'Trocar imagens' }).click();
        await page.getByRole('dialog', { name: 'Trocar imagens' }).waitFor();
    });
    await shot('01-trocar-imagens');

    await step('trocar a Foto 1, manter a Foto 2 e salvar', async () => {
        const form = page.getByRole('dialog', { name: 'Trocar imagens' });
        await form.getByLabel('Escolher Foto 1 · posição inicial').setInputFiles(FIX + '/qa-ref2.jpg');
        await page.getByRole('button', { name: 'Usar recorte' }).click();
        await form.getByRole('button', { name: 'Salvar' }).click();
        await form.waitFor({ state: 'hidden', timeout: 30000 });
        const fim = Date.now() + 10000;
        while ((!envio || envio.status === null) && Date.now() < fim) await page.waitForTimeout(200);
        if (!envio) throw new Error('não enviou as imagens');
        const slots = envio.body?.reference_image_slots ?? [];
        const mantida = slots.find((s) => 'keep' in s);
        if (!mantida || mantida.keep !== 1) throw new Error('a Foto 2 não foi mantida pela posição: ' + JSON.stringify(slots.map((s) => Object.keys(s))));
        if (!String(mantida.url).includes('X-Amz-Signature')) throw new Error('o keep não levou o link assinado');
        if (envio.status !== 200) throw new Error('o servidor respondeu ' + envio.status);
    });
    await page.waitForTimeout(1000);
    await shot('02-salvo');

    writeFileSync(
        new URL('../evidence/correcoes-conferencia/clinica-trocar-imagens.json', import.meta.url),
        JSON.stringify({ status: envio?.status, slots: (envio?.body?.reference_image_slots ?? []).map((s) => Object.keys(s)) }, null, 2),
    );
}
