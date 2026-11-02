# Aceite de Termos de Uso e Política de Privacidade (LGPD) no auto-cadastro

**Tipo:** História
**Plano:** `../plans/clinic-criar-conta-ds.md`
**Histórias:** 5
**Issue:** ainda não criada

## Descrição

Adiciona o aceite obrigatório dos Termos de Uso e da Política de Privacidade (LGPD) no 3º passo do auto-cadastro da clínica (`/clinica/criar-conta`) e grava o carimbo de data/hora do aceite (`terms_accepted_at`) no banco de dados ao criar a clínica e o usuário mestre.

## O que construir

No módulo `Clinic`, criar migration adicionando `terms_accepted_at` (`timestamp`, nullable) em `clinics` e `clinic_users`, exigir `terms_accepted` (`accepted`) no `RegisterClinicRequest` com mensagem em português e gravar `terms_accepted_at = now()` na clínica e no usuário mestre criados no auto-cadastro. No frontend, incluir `termsAccepted` no `clinicRegisterSchema` e renderizar um `DsCheckbox` no 3º passo de `ClinicRegisterPage.tsx` (abaixo do resumo da clínica), enviando `terms_accepted: true` no payload do repositório.

## Critérios de Aceite

- [x] `POST /api/clinic/auth/register` exige `terms_accepted` aceito (`true`), retornando `422` quando ausente ou `false`, e grava `terms_accepted_at` preenchido em `clinics` e no usuário mestre em `clinic_users`.
- [x] O 3º passo de `/clinica/criar-conta` exibe o checkbox de aceite dos Termos de Uso e Política de Privacidade (LGPD), impede a criação da conta quando desmarcado mostrando a mensagem de erro e envia `terms_accepted: true` quando marcado.
- [x] Um usuário ou cadastro não afeta dados de outra clínica.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `003-telas-criar-conta-confirmar-email-e-corte-v1` (Telas v2 de criar conta, confirmar e-mail, atalho no login e corte da v1)

## Notas de Implementação

- **Branch:** `feat/clinic-criar-conta-ds`
- **Exemplo no código:** `resources/js/components/ds/checkbox/DsCheckbox.tsx`, `resources/js/application/clinic/register-schema.ts`
- **Skills:** `backend-clean-code`, `php-modern`, `php-testing`, `frontend-ddd`, `design-system`, `frontend-testing`, `qa-navegador`

## Como testar na mão

1. Abrir `/clinica/criar-conta`, avançar até o 3º passo e clicar em "Criar conta" sem marcar o checkbox de termos: deve exibir a mensagem pedindo o aceite.
2. Marcar o checkbox e concluir o cadastro: a clínica e o usuário mestre devem nascer com `terms_accepted_at` preenchido no banco.
