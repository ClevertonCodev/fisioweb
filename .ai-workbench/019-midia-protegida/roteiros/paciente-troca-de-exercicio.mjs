import { writeFileSync } from 'node:fs';

export const name = 'paciente-troca-de-exercicio';
export const baseUrl = 'http://localhost:8000';

const PROGRAMA = process.env.QA_PROGRAMA;

export default async function ({ page, step, shot, url }) {
    const irPara = async (n) => {
        const rotulo = page.getByRole('button', { name: new RegExp('^Exercício ' + n + ':') }).first();
        if (await rotulo.isVisible()) return rotulo.click();
        const nomes = { 2: 'Bird Dog', 3: 'Retração Cervical', 4: 'Agachamento Unilateral', 5: 'Marcha Estacionária' };
        return page.getByRole('button', { name: nomes[n] }).first().click();
    };
    const baixados = [];
    page.on('request', (r) => {
        const u = new URL(r.url());
        if (u.hostname.endsWith('r2.cloudflarestorage.com') && u.pathname.endsWith('.mp4')) {
            baixados.push(u.pathname.split('/').pop());
        }
    });
    const estado = () =>
        page.locator('video').first().evaluate((v) => ({
            src: v.src.slice(0, 5),
            blob: v.src,
            readyState: v.readyState,
            paused: v.paused,
        }));

    await step('abrir a execução', async () => {
        await page.goto(url(PROGRAMA + '/executar'));
        await page.locator('video').first().waitFor({ state: 'attached' });
    });
    await step('tocar o exercício 1', async () => {
        await page.getByRole('button', { name: /^Reproduzir / }).first().click();
        await page.waitForFunction(() => document.querySelector('video')?.src.startsWith('blob:'), null, { timeout: 30000 });
    });
    await page.waitForTimeout(1200);
    await shot('01-exercicio-1-tocando');
    const primeiro = await estado();

    await step('avançar para o exercício 2: o player esvazia', async () => {
        await irPara(2);
        await page.waitForTimeout(500);
        const depois = await estado();
        if (depois.src === 'blob:') throw new Error('o player continuou com o blob do exercício 1');
        if (depois.readyState !== 0) throw new Error(`o vídeo anterior continuou carregado (readyState ${depois.readyState})`);
    });
    await step('a capa do exercício 2 aparece no lugar do vídeo', async () => {
        const capa = await page.locator('video').first().evaluate((v) => {
            const b = v.getBoundingClientRect();
            const el = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 3);
            const img = v.parentElement.querySelector('img');
            return { topo: el?.tagName, img: !!img && img.complete && img.naturalWidth > 0, invisivel: getComputedStyle(v).visibility };
        });
        if (!capa.img || capa.invisivel !== 'hidden' || capa.topo === 'VIDEO') throw new Error('capa escondida: ' + JSON.stringify(capa));
    });
    await shot('02-exercicio-2-antes-do-play');

    await step('tocar o exercício 2 baixa outro arquivo', async () => {
        await page.getByRole('button', { name: /^Reproduzir / }).first().click();
        await page.waitForFunction(() => document.querySelector('video')?.src.startsWith('blob:'), null, { timeout: 30000 });
        const segundo = await estado();
        if (baixados.length < 2) throw new Error('só um download: ' + JSON.stringify(baixados));
        if (baixados[0] === baixados[1]) throw new Error('o exercício 2 baixou o mesmo arquivo do 1');
        if (segundo.blob === primeiro.blob) throw new Error('o blob do exercício 2 é o mesmo do 1');
    });
    await page.waitForTimeout(1200);
    await shot('03-exercicio-2-tocando');

    await step('ir para o exercício 4, que usa o mesmo arquivo do 2, mantém o vídeo', async () => {
        const antes = (await estado()).blob;
        await irPara(4);
        await page.waitForTimeout(500);
        if ((await estado()).blob !== antes) throw new Error('baixou de novo o mesmo arquivo');
    });

    await step('ir para o 5 (outro arquivo) e trocar para o 4 no meio do download', async () => {
        const blobAntes = (await estado()).blob;
        await page.route('**/*r2.cloudflarestorage.com/**', async (route) => {
            await new Promise((r) => setTimeout(r, 2500));
            return route.continue();
        });
        await irPara(5);
        await page.getByRole('button', { name: /^Reproduzir / }).first().click();
        await page.waitForTimeout(300);
        await irPara(4);
        const play4 = page.getByRole('button', { name: /^Reproduzir / }).first();
        if (!(await play4.isEnabled())) throw new Error('o botão do exercício 4 ficou travado pelo download do 5');
        await play4.click({ timeout: 1000 });
        await page.waitForFunction(() => document.querySelector('video')?.src.startsWith('blob:'), null, { timeout: 30000 });
        await page.unroute('**/*r2.cloudflarestorage.com/**');
        const fim = await estado();
        if (fim.blob === blobAntes) throw new Error('o player ficou com o blob anterior');
        if (fim.paused) throw new Error('o exercício 4 não está tocando');
    });
    await shot('04-exercicio-4-tocando');

    writeFileSync(
        new URL('../evidence/correcoes-conferencia/paciente-troca.json', import.meta.url),
        JSON.stringify({ baixados }, null, 2),
    );
}
