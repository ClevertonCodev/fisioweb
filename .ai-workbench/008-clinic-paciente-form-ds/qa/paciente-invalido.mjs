import { confirmarTemaEscuro, prepararTemaEscuro } from './tema-escuro.mjs'

export const name = 'paciente campos invalidos'
export const baseUrl = 'http://localhost:8000'
export const loginUrl = '/clinica/pacientes/novo'

export default async function ({ page, step, shot, url }) {
    await prepararTemaEscuro(page)
    await step('abrir', () => page.goto(url('/clinica/pacientes/novo')))
    await confirmarTemaEscuro(page)

    await step('cpf e data invalidos', async () => {
        await page.getByRole('textbox', { name: /nome completo/i }).fill('QA')
        await page.getByLabel(/^CPF/).pressSequentially('11111111111', {
            delay: 15,
        })
        await page
            .getByRole('textbox', { name: /data de nascimento/i })
            .pressSequentially('32131990', { delay: 15 })
    })
    await shot('identificacao-invalida')

    await step('telefone e email invalidos', async () => {
        await page.getByRole('tab', { name: 'Contato' }).click()
        await page.getByLabel(/celular/i).pressSequentially('123', { delay: 20 })
        await page.getByRole('textbox', { name: /^e-mail/i }).fill('nao-e-email')
    })
    await shot('contato-invalido')

    await step('concluir continua travado ou mostra erro', async () => {
        const submit = page.getByRole('button', { name: 'Concluir cadastro' })
        if (await submit.isEnabled()) {
            await submit.click()
            await page.waitForTimeout(800)
            if (/\/clinica\/pacientes\/?$/.test(page.url())) {
                throw new Error('salvou paciente com dados invalidos')
            }
        }
    })
    await shot('depois-de-tentar')
}
