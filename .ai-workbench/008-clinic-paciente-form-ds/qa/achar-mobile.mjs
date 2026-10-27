export const name = 'achar paciente mobile na lista'
export const baseUrl = 'http://localhost:8000'
export const loginUrl = '/clinica/pacientes'

export default async function ({ page, step, shot, url }) {
    await step('buscar', async () => {
        await page.goto(url('/clinica/pacientes'))
        await page.getByLabel('Pesquisar pacientes').fill('QA Mobile')
        await page.waitForTimeout(1200)
    })
    await shot('busca')
}
