import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { confirmarTemaEscuro, prepararTemaEscuro } from './tema-escuro.mjs'

const stamp = Date.now()
const patientName = `QA Mobile ${stamp}`
const email = `qa.mobile.${stamp}@fisioweb.test`
const photo = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../smoke/foto.png',
)

export const name = 'paciente completo no celular'
export const baseUrl = 'http://localhost:8000'
export const loginUrl = '/clinica/pacientes/novo'

async function pick(page, label, option) {
    await page.getByRole('button', { name: new RegExp(label, 'i') }).click()
    await page.getByRole('option', { name: option, exact: true }).click()
}

export default async function ({ page, step, shot, url }) {
    await prepararTemaEscuro(page)
    await step('abrir', () => page.goto(url('/clinica/pacientes/novo')))
    await confirmarTemaEscuro(page)
    await shot('vazio-mobile')

    await step('preencher tudo', async () => {
        await page.getByRole('textbox', { name: /nome completo/i }).fill(patientName)
        await page.getByRole('textbox', { name: /apelido/i }).fill('QA Mob')
        await page.getByLabel(/^CPF/).pressSequentially('71428793860', {
            delay: 12,
        })
        await page
            .getByRole('textbox', { name: /data de nascimento/i })
            .pressSequentially('20021995', { delay: 12 })
        await page.locator('input[type="file"]').setInputFiles(photo)
        await page.getByRole('button', { name: 'Usar foto' }).click()
        await page.getByRole('button', { name: 'Usar foto' }).waitFor({
            state: 'hidden',
            timeout: 8000,
        })
        await page.getByRole('tab', { name: 'Perfil e diagnóstico' }).click()
        await pick(page, 'estado civil', 'Solteiro(a)')
        await page.getByRole('textbox', { name: /profissão/i }).fill('Estudante')
        await page.getByRole('tab', { name: 'Contato' }).click()
        await page.getByLabel(/celular/i).pressSequentially('84977776666', {
            delay: 12,
        })
        await page.getByRole('textbox', { name: /^e-mail/i }).fill(email)
        await page.getByRole('tab', { name: 'Endereço' }).click()
        await page.getByRole('textbox', { name: /^cep/i }).fill('59025000')
        await page.waitForTimeout(900)
        await page.getByRole('textbox', { name: /^número/i }).fill('100')
        await page.getByRole('tab', { name: 'Convênio' }).click()
        await page
            .getByRole('switch', { name: /atendido por convênio/i })
            .click()
        await page.getByRole('textbox', { name: /^convênio/i }).fill('Amil')
        await page.getByRole('tab', { name: 'Como conheceu' }).click()
        await pick(page, 'como conheceu a clínica', 'Google')
    })
    await shot('preenchido')

    await step('concluir', async () => {
        await page.getByRole('button', { name: 'Concluir cadastro' }).click()
        await page.waitForURL(/\/clinica\/pacientes\/?(\?|$)/, {
            timeout: 20000,
        })
    })
    await shot('lista-mobile')
}
