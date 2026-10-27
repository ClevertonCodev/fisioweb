import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { confirmarTemaEscuro, prepararTemaEscuro } from './tema-escuro.mjs'

const stamp = Date.now()
const userName = `QA User Completo ${stamp}`
const email = `qa.user.completo.${stamp}@fisioweb.test`
const photo = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../smoke/foto.png',
)

export const name = 'usuario todos os campos'
export const baseUrl = 'http://localhost:8000'
export const loginUrl = '/clinica/usuarios/novo'

export default async function ({ page, step, shot, url }) {
    await prepararTemaEscuro(page)
    await step('abrir cadastro', () => page.goto(url('/clinica/usuarios/novo')))
    await confirmarTemaEscuro(page)
    await shot('vazio')

    await step('foto nome email', async () => {
        await page.locator('input[type="file"]').first().setInputFiles(photo)
        await page.getByRole('textbox', { name: /^nome/i }).fill(userName)
        await page.getByRole('textbox', { name: /^e-mail/i }).fill(email)
    })
    await shot('identidade')

    await step('crefito e funcao fisioterapeuta', async () => {
        await page
            .getByRole('radiogroup', { name: 'Tipo de documento' })
            .getByRole('radio', { name: /crefito/i })
            .click()
        await page
            .getByRole('textbox', { name: /registro no crefito/i })
            .fill('RN-654321-F')
        await page
            .getByRole('radiogroup', { name: 'Função' })
            .getByRole('radio', { name: /^fisioterapeuta/i })
            .click()
        const status = page.getByRole('switch', { name: /conta ativa/i })
        if (!(await status.isChecked())) {
            await status.click()
        }
    })
    await shot('registro-funcao')

    await step('senha', async () => {
        await page.getByLabel(/^senha$/i).fill('QaUser#2026ab')
        await page.getByLabel(/confirmar senha/i).fill('QaUser#2026ab')
    })
    await shot('antes-de-criar')

    await step('criar', async () => {
        await page.getByRole('button', { name: 'Criar usuário' }).click()
        await page.waitForURL(/\/clinica\/usuarios\/?$/, { timeout: 20000 })
    })
    await shot('lista')

    await step('achar na lista', async () => {
        const search = page.getByLabel('Pesquisar usuários')
        if (await search.count()) {
            await search.fill(userName)
            await page.waitForTimeout(800)
        }
        const hit = page.getByText(userName)
        await hit.first().waitFor({ timeout: 15000 })
    })
    await shot('na-lista')
}
