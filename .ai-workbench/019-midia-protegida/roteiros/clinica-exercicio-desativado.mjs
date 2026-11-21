import { writeFileSync } from 'node:fs';

export const name = 'clinica-exercicio-desativado';
export const baseUrl = 'http://localhost:8000';
export const loginUrl = '/clinica/programas';

const PROGRAMA_ID = process.env.QA_PROGRAMA_ID ?? '1';
const MODELO = process.env.QA_MODELO ?? 'Programa Pós-Operatório Ombro (modelo)';

export default async function ({ page, step, shot, url }) {
    const pedidos = [];
    page.on('request', (r) => {
        const u = new URL(r.url());
        if (u.pathname.startsWith('/api/clinic/exercises/') || u.pathname.startsWith('/api/clinic/treatment-plans/')) {
            pedidos.push(`${r.method()} ${u.pathname}`);
        }
    });
    await page.route('**/api/clinic/exercises/*', (route) =>
        route.fulfill({ status: 404, json: { message: 'Exercício não encontrado.' } }),
    );

    let videoVencido = false;
    let capaVencida = false;
    await page.route('**/*r2.cloudflarestorage.com/**', async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (!videoVencido && path.endsWith('.mp4')) {
            videoVencido = true;
            return route.fulfill({ status: 403, body: 'expired' });
        }
        if (capaVencida === 'armado' && /\/(covers|thumbnails)\//.test(path)) {
            capaVencida = path;
            return route.fulfill({ status: 403, body: 'expired' });
        }
        return route.continue();
    });

    await step('montador: abrir a edição do programa', async () => {
        await page.goto(url(`/clinica/programas/${PROGRAMA_ID}/editar`));
        await page.getByRole('button', { name: 'Reproduzir Ponte Glútea', exact: true }).first().waitFor({ timeout: 20000 });
    });
    await step('montador: link vencido e exercício desativado, o vídeo vem do programa salvo e toca', async () => {
        const antes = pedidos.length;
        await page
            .getByRole('button', { name: 'Reproduzir Ponte Glútea', exact: true })
            .first()
            .click({ position: { x: 8, y: 8 }, timeout: 5000 });
        await page.waitForFunction(
            () => [...document.querySelectorAll('video')].some((v) => v.src.startsWith('blob:')),
            null,
            { timeout: 30000 },
        );
        const depois = pedidos.slice(antes);
        if (!videoVencido) throw new Error('o 403 simulado não aconteceu');
        if (!depois.some((p) => p.startsWith('GET /api/clinic/exercises/'))) throw new Error('não tentou o exercício: ' + depois.join(', '));
        if (!depois.includes(`GET /api/clinic/treatment-plans/${PROGRAMA_ID}`)) throw new Error('não buscou o programa: ' + depois.join(', '));
        if (await page.getByText('Não foi possível').count()) throw new Error('mostrou erro');
    });
    await page.waitForTimeout(800);
    await shot('01-montador-tocando');

    let inicioModelos = 0;
    await step('Meus modelos: abrir a lista', async () => {
        inicioModelos = pedidos.length;
        capaVencida = 'armado';
        await page.goto(url('/clinica/programas/meus-modelos'));
        await page.getByText(MODELO).first().waitFor({ timeout: 20000 });
    });
    await step('Meus modelos: capa vencida de exercício desativado vem do modelo e carrega', async () => {
        const deadline = Date.now() + 20000;
        while (typeof capaVencida !== 'string' && Date.now() < deadline) await page.waitForTimeout(200);
        if (typeof capaVencida !== 'string') throw new Error('nenhuma capa pedida ao R2');
        const sequencia = () => {
            const daTela = pedidos.slice(inicioModelos);
            const exercicio = daTela.findIndex((p) => p.startsWith('GET /api/clinic/exercises/'));
            const modelo = daTela.findIndex((p, i) => exercicio >= 0 && i > exercicio && p.startsWith('GET /api/clinic/treatment-plans/'));
            return { daTela, ok: exercicio >= 0 && modelo >= 0 };
        };
        const fim = Date.now() + 20000;
        while (!sequencia().ok && Date.now() < fim) await page.waitForTimeout(200);
        if (!sequencia().ok) throw new Error('caminho errado: ' + sequencia().daTela.join(', '));
        await page.waitForTimeout(1500);
        const carregadas = await page.evaluate(
            (p) => [...document.querySelectorAll('img')].filter((i) => i.src.includes(p)).map((i) => i.complete && i.naturalWidth > 0),
            capaVencida,
        );
        if (!carregadas.length || carregadas.some((ok) => !ok)) throw new Error('capa não carregou: ' + JSON.stringify(carregadas));
    });
    await shot('02-meus-modelos');

    writeFileSync(
        new URL('../evidence/correcoes-conferencia/clinica-exercicio-desativado.json', import.meta.url),
        JSON.stringify({ pedidos, capaVencida: String(capaVencida).split('/').pop() }, null, 2),
    );
}
