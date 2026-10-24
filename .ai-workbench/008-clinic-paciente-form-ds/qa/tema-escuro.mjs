export async function prepararTemaEscuro(page) {
    await page.addInitScript(() => {
        localStorage.setItem('fisioweb-ds-theme', 'dark');
    });
}

export async function confirmarTemaEscuro(page) {
    const theme = await page.evaluate(
        () => document.documentElement.dataset.theme,
    );
    if (theme === 'dark') return;
    const toggle = page.getByRole('button', { name: 'Ativar tema escuro' });
    if (await toggle.count()) {
        await toggle.click();
    }
}
