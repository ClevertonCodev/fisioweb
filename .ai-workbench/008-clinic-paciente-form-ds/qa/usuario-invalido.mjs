import { confirmarTemaEscuro, prepararTemaEscuro } from './tema-escuro.mjs'

export const name = 'usuario campos invalidos'
export const baseUrl = 'http://localhost:8000'
export const loginUrl = '/clinica/usuarios/novo'

export default async function ({ page, step, shot, url }) {
    await prepararTemaEscuro(page)
    await step('abrir', () => page.goto(url('/clinica/usuarios/novo')))
    await confirmarTemaEscuro(page)

    await step('senha curta e email invalido', async () => {
        await page.getByRole('textbox', { name: /^nome/i }).fill('QA')
        await page.getByRole('textbox', { name: /^e-mail/i }).fill('nao-e-email')
        await page
            .getByRole('radiogroup', { name: 'Função' })
            .getByRole('radio', { name: /^fisioterapeuta/i })
            .click()
        await page.getByLabel(/^senha$/i).fill('curta')
        await page.getByLabel(/confirmar senha/i).fill('outra')
    })
    await shot('preenchido-errado')

    await step('tentar criar', async () => {
        await page.getByRole('button', { name: 'Criar usuário' }).click()
        await page.waitForTimeout(800)
        if (/\/clinica\/usuarios\/?$/.test(page.url()) && !page.url().includes('novo')) {
            throw new Error('criou usuario com dados invalidos')
        }
    })
    await shot('depois-de-tentar')
}
