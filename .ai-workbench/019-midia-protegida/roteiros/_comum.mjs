export const FIX = new URL(
    '../../015-clinic-enviar-exercicio-ds/evidence/003-correcoes-code-review/fixtures',
    import.meta.url,
).pathname;

export const PUBLICO = [/cdn_url/, /cdn-dev\.ivsmed\.com/, /\.r2\.dev/, /"thumbnail_path"/, /"photo_path"/, /"file_path"/];

export function vigiar(page) {
    const api = [];
    const storage = [];
    page.on('response', async (r) => {
        const u = r.url();
        if (u.includes('r2.cloudflarestorage.com')) {
            const headers = r.request().headers();
            storage.push({
                method: r.request().method(),
                status: r.status(),
                auth: 'authorization' in headers,
                expires: (u.match(/X-Amz-Expires=(\d+)/) ?? [])[1] ?? null,
            });
            return;
        }
        if (!u.includes('/api/')) return;
        const type = r.headers()['content-type'] ?? '';
        if (!type.includes('json')) return;
        try {
            const body = await r.text();
            for (const p of PUBLICO) {
                if (p.test(body)) api.push(`${r.request().method()} ${new URL(u).pathname} contém ${p}`);
            }
        } catch {
            /* resposta sem corpo */
        }
    });
    return { api, storage };
}

export async function preencher(page, nome) {
    await page.locator('input[type="file"][accept*="video/mp4"]').setInputFiles(FIX + '/qa-quadrado.mp4');
    await page.getByText('1:1 · 1080×1080').waitFor({ state: 'visible' });
    await page.getByLabel('Nome do exercício').fill(nome);
    await page.getByLabel('Categoria').selectOption({ index: 1 });
    await page.getByLabel('Como fazer').fill('Eleve o quadril e segure 3 segundos.');
    const imgs = page.locator('input[type="file"][accept*="image/jpeg"]');
    const files = [['Capa', 'qa-capa.jpg'], ['Foto 1', 'qa-ref1.jpg'], ['Foto 2', 'qa-ref2.jpg']];
    for (const [i, [label, file]] of files.entries()) {
        await imgs.nth(i).setInputFiles(FIX + '/' + file);
        const dialog = page.getByRole('dialog', { name: new RegExp('Recortar ' + label, 'i') });
        await dialog.waitFor({ state: 'visible' });
        await page.getByRole('button', { name: 'Usar recorte' }).click();
        await dialog.waitFor({ state: 'hidden' });
    }
}

export function conferir(api, storage, { querPlay = true } = {}) {
    const problemas = [...api];
    if (storage.some((s) => s.auth)) problemas.push('download no armazenamento levou Authorization');
    if (querPlay && !storage.some((s) => s.method === 'GET' && s.status === 200)) {
        problemas.push('nenhum download 200 do armazenamento');
    }
    return problemas;
}
