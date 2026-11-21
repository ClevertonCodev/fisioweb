# Sair dos lembretes pelo link do e-mail

**Tipo:** História
**Plano:** `../plans/modulo-comunicacao.md`
**Histórias:** 30, 33
**Issue:** ainda não criada

## Descrição

O lembrete da tarefa 009 tem no rodapé o link "Não quero mais receber lembretes". Esta tarefa cria o caminho completo: o token no link, a página pública com um botão de confirmar e o endpoint que desliga o lembrete do paciente.

A página pede confirmação porque antivírus e leitores de e-mail abrem links sozinhos. Se o link descadastrasse direto, eles descadastrariam o paciente sem ele saber.

## O que construir

- **Token:** HMAC de `clinicId` + `patientId` com a chave da aplicação, comparado com `hash_equals`, o mesmo jeito da confirmação de cadastro. Ele não vence: o paciente pode sair a qualquer momento. Volta a receber só se a clínica religar no cadastro.
- **Endpoint público `POST /api/email/reminders/unsubscribe`, com `{ token }`** (módulo `Email`, sem guard):
  - Token inválido ou adulterado dá 404 e não muda nada.
  - Token válido desliga o lembrete do paciente pelo contrato de escrita do `Patient` (filtrado por `clinicId` + `patientId`) e responde 200.
  - Chamar de novo responde 200 de novo (idempotente).
- **Contrato público de escrita no `Patient`:** desligar o lembrete por `clinicId` + `patientId`.
- **Página pública no SPA (sem login), no endereço do link do e-mail:**
  - Mostra "Não quer mais receber lembretes de consulta por e-mail?" e o botão "Não quero mais receber lembretes".
  - Ao confirmar, mostra "Pronto. Você não vai mais receber lembretes. Para voltar a receber, fale com a clínica."
  - Link inválido mostra "Link inválido".
  - A página não mostra nome, e-mail nem nenhum outro dado do paciente.
- **O link do rodapé do lembrete** passa a apontar para essa página com o token.
- **Sem migration.**

## Critérios de Aceite

- [x] Token válido desliga o lembrete do paciente certo e responde 200; chamar de novo continua 200 (teste).
- [x] Token adulterado, de outro paciente ou montado com outro `clinicId` dá 404 e não muda nenhum paciente (teste).
- [x] Depois de sair, o próximo lembrete não é enviado ao paciente (teste junto com o listener da 009).
- [x] Abrir a página não descadastra; só o botão faz o `POST` (Vitest).
- [x] A página mostra a confirmação e o estado de link inválido, sem nenhum dado do paciente (Vitest).
- [x] O link do rodapé do lembrete leva a essa página com o token (teste do template).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Um paciente não vê nem altera nada de outro paciente
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `009-disparar-lembrete` (o lembrete com o link no rodapé).

## Notas de Implementação

- **Branch:** `feat/modulo-comunicacao`
- **Exemplo no código:**
  - `ClinicRegistrationService` (HMAC com a chave da aplicação e `hash_equals` na confirmação de cadastro)
  - As páginas públicas da área do paciente em `pages/patient/`
- **Skills:** `architecture-paradigm-modular-monolith`, `security-audit`, `php-testing`, `frontend-ddd`, `design-system`, `frontend-testing`.

## Como testar na mão

1. Receba um lembrete (passo a passo da tarefa 009) e clique em "Não quero mais receber lembretes".
2. A página abre sem descadastrar. Clique no botão: aparece "Pronto".
3. No cadastro do paciente, a chave do lembrete aparece desligada.
4. Troque uma letra do token na URL e confirme: aparece "Link inválido", e nada muda.
