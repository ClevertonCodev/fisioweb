export const name = 'prontuario mostra apelido'
export const baseUrl = 'http://localhost:8000'
export const loginUrl = '/clinica/pacientes/107'

export default async function ({ page, step, shot, url }) {
    await step('abrir prontuario', () =>
        page.goto(url('/clinica/pacientes/107')),
    )
    await page.getByRole('heading', { name: /QA Apelido/i }).waitFor({
        timeout: 15000,
    })
    await shot('cabecalho')
}
