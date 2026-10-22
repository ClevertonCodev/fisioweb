import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { confirmarTemaEscuro, prepararTemaEscuro } from './tema-escuro.mjs'

const stamp = Date.now()
export const patientName = `QA Completo ${stamp}`
const apelido = `QA Apelido ${stamp}`
const email = `qa.completo.${stamp}@fisioweb.test`
const photo = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../smoke/foto.png',
)

export const name = 'paciente todos os campos'
export const baseUrl = 'http://localhost:8000'
export const loginUrl = '/clinica/pacientes/novo'

async function pick(page, label, option) {
    await page.getByRole('button', { name: new RegExp(label, 'i') }).click()
    await page.getByRole('option', { name: option, exact: true }).click()
}

export default async function ({ page, step, shot, url }) {
    await prepararTemaEscuro(page)
    await step('abrir cadastro', () => page.goto(url('/clinica/pacientes/novo')))
    await confirmarTemaEscuro(page)
    await shot('vazio')

    await step('identificacao completa', async () => {
        await page.getByRole('textbox', { name: /nome completo/i }).fill(patientName)
        await page.getByRole('textbox', { name: /apelido/i }).fill(apelido)
        await page.getByRole('switch', { name: /usar apelido no sistema/i }).click()
        await page.getByLabel(/^CPF/).pressSequentially('54862789501', {
            delay: 15,
        })
        await page
            .getByRole('textbox', { name: /data de nascimento/i })
            .pressSequentially('15031988', { delay: 15 })
        await pick(page, 'situação do tratamento', 'Em treinamento')
        await page.locator('input[type="file"]').setInputFiles(photo)
        await page.getByRole('button', { name: 'Usar foto' }).click()
        await page.getByRole('button', { name: 'Usar foto' }).waitFor({
            state: 'hidden',
            timeout: 8000,
        })
    })
    await shot('identificacao')

    await step('perfil completo', async () => {
        await page.getByRole('tab', { name: 'Perfil e diagnóstico' }).click()
        await pick(page, 'estado civil', 'Casado(a)')
        await page.getByRole('textbox', { name: /profissão/i }).fill('Professora')
        await pick(page, 'sexo biológico', 'Feminino')
        await pick(page, 'gênero', 'Mulher')
        await pick(page, 'escolaridade', 'Ensino Superior')
        await page
            .getByRole('textbox', { name: /resumo do diagnóstico/i })
            .fill('Lombalgia crônica pós-cirúrgica — QA')
    })
    await shot('perfil')

    await step('contato', async () => {
        await page.getByRole('tab', { name: 'Contato' }).click()
        await page.getByLabel(/celular/i).pressSequentially('84988887777', {
            delay: 15,
        })
        await page.getByRole('textbox', { name: /^e-mail/i }).fill(email)
    })
    await shot('contato')

    await step('endereco com cep', async () => {
        await page.getByRole('tab', { name: 'Endereço' }).click()
        await page.getByRole('textbox', { name: /^cep/i }).fill('01310100')
        await page.getByText(/são paulo\/sp|buscando/i).waitFor({
            timeout: 8000,
        }).catch(() => {})
        await page.waitForTimeout(800)
        const street = page.getByRole('textbox', { name: /rua \/ avenida/i })
        if (!(await street.inputValue())) {
            await street.fill('Avenida Paulista')
            await page.getByRole('textbox', { name: /^bairro/i }).fill('Bela Vista')
            await page.getByRole('textbox', { name: /^cidade/i }).fill('São Paulo')
            await pick(page, '^uf$|uf', 'SP')
        }
        await page.getByRole('textbox', { name: /^número/i }).fill('1578')
        await page
            .getByRole('textbox', { name: /complemento/i })
            .fill('Conj. 1201')
    })
    await shot('endereco')

    await step('convenio', async () => {
        await page.getByRole('tab', { name: 'Convênio' }).click()
        await page
            .getByRole('switch', { name: /atendido por convênio/i })
            .click()
        await page.getByRole('textbox', { name: /^convênio/i }).fill('Unimed')
        await page
            .getByRole('textbox', { name: /número da carteirinha/i })
            .fill('99887766')
    })
    await shot('convenio')

    await step('origem', async () => {
        await page.getByRole('tab', { name: 'Como conheceu' }).click()
        await pick(page, 'como conheceu a clínica', 'Instagram')
        const add = page.getByRole('button', {
            name: 'Adicionar profissional da saúde',
        })
        if (await add.isEnabled()) {
            throw new Error('indicação de profissional deveria estar desligada')
        }
    })
    await shot('origem')

    await step('concluir', async () => {
        await page.getByRole('button', { name: 'Concluir cadastro' }).click()
        await page.waitForURL(/\/clinica\/pacientes\/?(\?|$)/, {
            timeout: 20000,
        })
    })
    await shot('lista')

    await step('achar na lista', async () => {
        const search = page.getByLabel('Pesquisar pacientes')
        await search.fill(apelido)
        const hit = page.getByRole('link', { name: new RegExp(apelido, 'i') })
        const full = page.getByRole('link', { name: new RegExp(patientName, 'i') })
        await page.waitForTimeout(900)
        if ((await hit.count()) === 0 && (await full.count()) === 0) {
            await search.fill(patientName)
            await page.waitForTimeout(900)
        }
        const found =
            (await hit.count()) > 0 ||
            (await page.getByRole('link', { name: new RegExp(patientName, 'i') }).count()) >
                0
        if (!found) throw new Error('paciente nao apareceu na lista')
    })
    await shot('na-lista')
}
