import { writeFileSync } from 'node:fs';

import { vigiar } from './_comum.mjs';

export const name = 'outra-clinica';
export const baseUrl = 'http://localhost:8000';
export const loginUrl = '/clinica/exercicios';

const NOME = process.env.QA_NOME;
const CAMINHO = process.env.QA_CAMINHO;

export default async function ({ page, step, shot, url }) {
    const { api } = vigiar(page);
    const corpos = [];
    page.on('response', async (r) => {
        if (r.url().includes('/api/') && (r.headers()['content-type'] ?? '').includes('json')) {
            corpos.push(await r.text().catch(() => ''));
        }
    });

    await step('abrir biblioteca da outra clínica', () => page.goto(url('/clinica/exercicios')));
    await step('o exercício pendente da clínica 1 não aparece', async () => {
        await page.getByRole('searchbox', { name: 'Pesquisar exercícios' }).fill(NOME);
        await page.getByText('0 exercícios encontrados').waitFor({ timeout: 15000 });
        if (await page.getByRole('button', { name: `Reproduzir ${NOME}` }).count()) throw new Error('o exercício da clínica 1 apareceu');
    });
    await shot('01-busca-sem-resultado');
    await step('nenhuma resposta traz o caminho do vídeo da clínica 1', async () => {
        await page.goto(url('/clinica/programas/exercicios'));
        await page.waitForTimeout(2500);
        const vazou = corpos.filter((c) => c.includes(CAMINHO)).length;
        writeFileSync(
            new URL('../evidence/correcoes-conferencia/outra-clinica.json', import.meta.url),
            JSON.stringify({ respostas: corpos.length, vazou, api }, null, 2),
        );
        if (vazou) throw new Error(`${vazou} resposta(s) com o caminho do vídeo da clínica 1`);
        if (api.length) throw new Error(api.join(' | '));
    });
}
