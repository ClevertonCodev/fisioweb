import { writeFileSync } from 'node:fs';

export const name = 'clinica-montador-renovacao';
export const baseUrl = 'http://localhost:8000';
export const loginUrl = '/clinica/programas';

const PROGRAMA_ID = process.env.QA_PROGRAMA_ID ?? '1';

export default async function ({ page, step, shot, url }) {
    const renovacoes = [];
    page.on('request', (r) => {
        const u = new URL(r.url());
        const m = u.pathname.match(/^\/api\/clinic\/exercises\/([^/]+)$/);
        if (m && r.method() === 'GET') renovacoes.push(m[1]);
    });

    await page.route(`**/api/clinic/treatment-plans/${PROGRAMA_ID}`, async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        const response = await route.fetch();
        const json = await response.json();
        for (const group of json.data?.groups ?? []) {
            for (const e of group.exercises ?? []) e.id = Number(e.id) + 1000;
        }
        for (const e of json.data?.exercises ?? []) e.id = Number(e.id) + 1000;
        return route.fulfill({ response, json });
    });

    let vencido = false;
    await page.route('**/*r2.cloudflarestorage.com/**', async (route) => {
        if (!vencido && new URL(route.request().url()).pathname.endsWith('.mp4')) {
            vencido = true;
            return route.fulfill({ status: 403, body: 'expired' });
        }
        return route.continue();
    });

    await step('abrir a edição do programa no montador', async () => {
        await page.goto(url(`/clinica/programas/${PROGRAMA_ID}/editar`));
        await page.getByRole('button', { name: 'Reproduzir Ponte Glútea', exact: true }).first().waitFor({ timeout: 20000 });
    });
    await shot('01-montador');

    await step('com o link vencido, o play pede o link novo pelo id do exercício e toca', async () => {
        await page
            .getByRole('button', { name: 'Reproduzir Ponte Glútea', exact: true })
            .first()
            .click({ position: { x: 8, y: 8 }, timeout: 5000 });
        await page.waitForFunction(
            () => [...document.querySelectorAll('video')].some((v) => v.src.startsWith('blob:')),
            null,
            { timeout: 30000 },
        );
        if (!vencido) throw new Error('o 403 simulado não aconteceu');
        if (!renovacoes.length) throw new Error('nenhum pedido de link novo');
        const errado = renovacoes.filter((id) => Number(id) >= 1000 || !/^\d+$/.test(id));
        if (errado.length) throw new Error('renovou pelo id do item: ' + errado.join(', '));
        if (await page.getByText('Não foi possível').count()) throw new Error('mostrou erro');
    });
    await page.waitForTimeout(1000);
    await shot('02-montador-tocando');

    writeFileSync(
        new URL('../evidence/correcoes-conferencia/clinica-montador.json', import.meta.url),
        JSON.stringify({ renovacoes }, null, 2),
    );
}
