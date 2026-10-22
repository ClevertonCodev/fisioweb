import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const stamp = Date.now()
const patientName = `QA Form Cadastro ${stamp}`
const email = `qa.form.cadastro.${stamp}@fisioweb.test`
const photo = resolve(
    dirname(fileURLToPath(import.meta.url)),
    'foto.png',
)

export const name = 'cadastrar paciente v2'
export const baseUrl = 'http://localhost:8000'
export const loginUrl = '/clinica/pacientes/novo'

export default async function ({ page, step, shot, url }) {
    await step('abrir cadastro', () => page.goto(url('/clinica/pacientes/novo')))
    await shot('cadastro-vazio')

    await step('sem barra de prototipo', async () => {
        const proto = page.getByText(/variante|protótipo|prototype/i)
        if ((await proto.count()) > 0) {
            throw new Error('barra de prototipo ainda na tela')
        }
        await page.getByRole('heading', { name: 'Novo paciente' }).waitFor()
        await page.getByRole('button', { name: 'Concluir cadastro' }).waitFor()
    })

    await step('preencher identificacao', async () => {
        await page.getByRole('textbox', { name: /nome completo/i }).fill(patientName)
        await page.getByLabel(/^CPF/).pressSequentially('47687346696', {
            delay: 20,
        })
        await page
            .getByRole('textbox', { name: /data de nascimento/i })
            .pressSequentially('01011990', { delay: 20 })
    })
    await shot('identificacao')

    await step('enviar foto e recortar', async () => {
        await page.locator('input[type="file"]').setInputFiles(photo)
        await page.getByRole('button', { name: 'Usar foto' }).click()
        await page.getByRole('button', { name: 'Usar foto' }).waitFor({
            state: 'hidden',
            timeout: 8000,
        })
    })
    await shot('com-foto')

    await step('contato obrigatorio', async () => {
        await page.getByRole('tab', { name: 'Contato' }).click()
        await page.getByLabel(/celular/i).pressSequentially('84999999999', {
            delay: 20,
        })
        await page.getByRole('textbox', { name: /^e-mail/i }).fill(email)
    })
    await shot('contato')

    await step('concluir cadastro', async () => {
        await page.getByRole('button', { name: 'Concluir cadastro' }).click()
        await page.waitForURL(/\/clinica\/pacientes\/?$/, { timeout: 20000 })
    })
    await shot('lista-depois')

    await step('achar na lista', async () => {
        await page.getByLabel('Pesquisar pacientes').fill(patientName)
        await page.getByRole('link', { name: patientName }).waitFor({
            timeout: 15000,
        })
        const href = await page
            .getByRole('link', { name: patientName })
            .getAttribute('href')
        const id = href?.match(/pacientes\/(\d+)/)?.[1]
        if (!id) throw new Error('nao achei o id na lista')
        writeFileSync(
            resolve(
                dirname(fileURLToPath(import.meta.url)),
                '../evidence/001-cadastro-vira-tela-real/last-patient.json',
            ),
            JSON.stringify({ id, name: patientName }, null, 2),
        )
    })
    await shot('na-lista')
}
