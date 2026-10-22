import { confirmarTemaEscuro, prepararTemaEscuro } from './tema-escuro.mjs'

export const name = 'conferir persistencia do cadastro completo'
export const baseUrl = 'http://localhost:8000'
export const loginUrl = '/clinica/pacientes'

export default async function ({ page, step, shot, url }) {
    await prepararTemaEscuro(page)
    await step('abrir lista e buscar', async () => {
        await page.goto(url('/clinica/pacientes'))
        await confirmarTemaEscuro(page)
        await page.getByLabel('Pesquisar pacientes').fill('QA Apelido')
        await page.getByRole('link', { name: /QA Apelido/i }).first().waitFor({
            timeout: 15000,
        })
    })
    await shot('lista')

    await step('abrir edicao', async () => {
        await page.getByRole('link', { name: 'Editar perfil' }).first().click()
        await page.getByRole('heading', { name: 'Editar paciente' }).waitFor({
            timeout: 15000,
        })
    })
    await shot('identificacao')

    await step('perfil', async () => {
        await page.getByRole('tab', { name: 'Perfil e diagnóstico' }).click()
    })
    await shot('perfil')

    await step('contato', async () => {
        await page.getByRole('tab', { name: 'Contato' }).click()
    })
    await shot('contato')

    await step('endereco', async () => {
        await page.getByRole('tab', { name: 'Endereço' }).click()
    })
    await shot('endereco')

    await step('convenio', async () => {
        await page.getByRole('tab', { name: 'Convênio' }).click()
    })
    await shot('convenio')

    await step('origem', async () => {
        await page.getByRole('tab', { name: 'Como conheceu' }).click()
    })
    await shot('origem')
}
