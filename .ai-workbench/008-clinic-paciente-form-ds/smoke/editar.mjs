import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const saved = JSON.parse(
    readFileSync(
        resolve(
            dirname(fileURLToPath(import.meta.url)),
            '../evidence/001-cadastro-vira-tela-real/last-patient.json',
        ),
        'utf8',
    ),
)
const photo = resolve(dirname(fileURLToPath(import.meta.url)), 'foto.png')

export const name = 'editar paciente v2'
export const baseUrl = 'http://localhost:8000'
export const loginUrl = `/clinica/pacientes/${saved.id}/editar`

export default async function ({ page, step, shot, url }) {
    await step('abrir edicao', () =>
        page.goto(url(`/clinica/pacientes/${saved.id}/editar`)),
    )
    await page.getByRole('heading', { name: 'Editar paciente' }).waitFor({
        timeout: 15000,
    })
    await shot('edicao-carregada')

    await step('sem barra de prototipo', async () => {
        const proto = page.getByText(/variante|protótipo|prototype/i)
        if ((await proto.count()) > 0) {
            throw new Error('barra de prototipo ainda na tela')
        }
        await page.getByRole('button', { name: 'Salvar alterações' }).waitFor()
    })

    await step('mudar apelido situacao e foto', async () => {
        await page.getByRole('textbox', { name: /apelido/i }).fill('QA Editado')
        await page
            .getByRole('button', { name: /situação do tratamento/i })
            .click()
        await page.getByRole('option', { name: 'Alta' }).click()
        await page.getByRole('button', { name: 'Trocar' }).click()
        await page.locator('input[type="file"]').setInputFiles(photo)
        await page.getByRole('button', { name: 'Usar foto' }).click()
        await page.getByRole('button', { name: 'Usar foto' }).waitFor({
            state: 'hidden',
            timeout: 8000,
        })
    })
    await shot('antes-de-salvar')

    await step('salvar com foto nova', async () => {
        await page.getByRole('button', { name: 'Salvar alterações' }).click()
        await page.waitForURL(new RegExp(`/clinica/pacientes/${saved.id}/?$`), {
            timeout: 20000,
        })
    })
    await shot('prontuario-com-foto')

    await step('abrir de novo e remover foto', async () => {
        await page.goto(url(`/clinica/pacientes/${saved.id}/editar`))
        await page.getByRole('heading', { name: 'Editar paciente' }).waitFor({
            timeout: 15000,
        })
        await page.getByRole('button', { name: 'Remover foto' }).click()
    })
    await shot('foto-removida')

    await step('salvar sem foto', async () => {
        await page.getByRole('button', { name: 'Salvar alterações' }).click()
        await page.waitForURL(new RegExp(`/clinica/pacientes/${saved.id}/?$`), {
            timeout: 20000,
        })
    })
    await shot('prontuario')
}
