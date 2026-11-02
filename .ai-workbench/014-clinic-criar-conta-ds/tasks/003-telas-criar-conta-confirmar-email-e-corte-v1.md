# Telas v2 de criar conta, confirmar e-mail, atalho no login e corte da v1

**Tipo:** História
**Plano:** `../plans/clinic-criar-conta-ds.md`
**Histórias:** 1, 2, 3, 4, 6, 7, 8, 9, 10, 13
**Issue:** ainda não criada

## Descrição

Substitui a tela v1 e o protótipo de `/clinica/criar-conta` pela tela oficial no Design System v2 ("Três passos"), cria a tela pública `/clinica/confirmar-email` para processar o link do e-mail de confirmação, adiciona o atalho de reenvio na tela de login quando o acesso é barrado por falta de confirmação e remove a pasta `register-prototype/` e o seletor `?variant=`.

## O que construir

Criar o repositório em `infrastructure/repositories/` e as funções/hooks em `application/clinic/` para auto-cadastro, checagem de slug, confirmação de e-mail e reenvio, convertendo `PF`→`fisica`, `PJ`→`juridica` e enviando documento e telefone apenas com dígitos. Reescrever `ClinicRegisterPage.tsx` no DS v2 usando React Hook Form + Zod (`clinicRegisterSchema`), avanço por passo com `trigger`, preservação ao voltar, consulta de disponibilidade do slug com debounce (~400 ms), retorno automático ao passo do primeiro campo com erro em respostas `422`, e tela final de confirmação com botão de reenvio e contagem de 30 s. Criar `ClinicVerifyEmailPage.tsx` na rota `/clinica/confirmar-email` tratando confirmação automática e link vencido/inválido com opção de reenvio. Em `ClinicLoginPage.tsx`, exibir ação para reenviar o e-mail de confirmação quando o login for recusado por falta de confirmação. Apagar `register-prototype/` e atualizar `docs/prototipos-v2.md`.

## Critérios de Aceite

- [x] `/clinica/criar-conta` renderiza os 3 passos no DS v2 com React Hook Form + Zod, bloqueia avanço com campos inválidos, preserva valores ao voltar e alterna rótulo/máscara entre CNPJ e CPF.
- [x] O campo de endereço (`slug`) acompanha o nome da clínica até ser editado manualmente, consulta disponibilidade na API com debounce e impede o envio quando indisponível ou reservado.
- [x] Erros `422` da API são associados aos campos correspondentes e levam a tela de volta ao primeiro passo com erro; erro `429` exibe aviso de muitas tentativas; sucesso mostra a tela de confirmar e-mail com reenvio bloqueado por 30 s entre envios.
- [x] `/clinica/confirmar-email` confirma o e-mail ao abrir um link válido e permite solicitar novo link quando vencido ou incompleto.
- [x] `/clinica/login` oferece o reenvio do e-mail de confirmação quando a API retorna o bloqueio de e-mail não confirmado.
- [x] A pasta `resources/js/pages/clinic/register-prototype/` não existe mais, `ClinicRegisterPage.tsx` não importa `PrototypeSwitcher` nem `?variant=`, e `docs/prototipos-v2.md` marca "Criar conta" como concluído.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `002-confirmacao-de-email-e-bloqueio-no-login` (Confirmação de e-mail, backfill de usuários atuais e bloqueio no login)

## Notas de Implementação

- **Branch:** `feat/clinic-criar-conta-ds`
- **Exemplo no código:** `resources/js/pages/clinic/ClinicLoginPage.tsx`, `resources/js/pages/clinic/ClinicForgotPasswordPage.tsx`, `resources/js/test/ClinicAuthPages.test.tsx`, `resources/js/test/finances/finance-v1-cut.test.ts`
- **Skills:** `frontend-ddd`, `design-system`, `api-client`, `frontend-testing`, `qa-navegador`

## Como testar na mão

1. Abrir `/clinica/criar-conta`, preencher os 3 passos, conferir o indicador de disponibilidade do endereço e concluir o cadastro.
2. Na tela de confirmação, conferir o botão de reenvio com contagem de 30 s.
3. Abrir o link de `/clinica/confirmar-email?...` gerado no log de e-mail e conferir a confirmação e o botão "Entrar".
