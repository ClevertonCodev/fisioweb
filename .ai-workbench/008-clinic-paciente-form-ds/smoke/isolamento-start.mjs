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

export const name = 'start nao ve paciente da cleverton'
export const baseUrl = 'http://localhost:8000'
export const loginUrl = '/clinica/pacientes'

export default async function ({ page, step, shot, url }) {
    await step('abrir lista da start', () =>
        page.goto(url('/clinica/pacientes')),
    )
    await shot('lista-start')

    await step('busca nao acha o paciente da outra clinica', async () => {
        await page.getByLabel('Pesquisar pacientes').fill(saved.name)
        await page.waitForTimeout(800)
        const hit = page.getByRole('link', { name: saved.name })
        if ((await hit.count()) > 0) {
            throw new Error('Start viu o paciente da Cleverton')
        }
    })
    await shot('busca-vazia')

    await step('edicao do id alheio e 404', async () => {
        await page.goto(url(`/clinica/pacientes/${saved.id}/editar`))
        await page.getByText('Paciente não encontrado').waitFor({
            timeout: 15000,
        })
    })
    await shot('editar-404')
}
