# Mestre nasce sem senha e define a senha pelo link de primeiro acesso

**Tipo:** Bug
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 6, 11, 12, 13, 14, 15
**Issue:** ainda não criada

## Descrição

Hoje a clínica criada pelo operador nasce com o mestre ativo, com o e-mail verificado e com a senha igual ao CNPJ/CPF. Quem sabe o e-mail e o documento, que costumam ser públicos, entra como dono da clínica (achado Alto `clinic/admin-created-clinic/master-password-equals-document`).

A abordagem é o mestre nascer sem senha utilizável e definir a própria senha por um link de uso único que o operador gera. Esta tarefa cobre o backend, o endpoint do operador e a página pública. O bloco no admin é a tarefa 004.

## O que construir

- **Migration em `clinic_users`:** `first_access_token_hash` e `first_access_token_created_at`, as duas nulas.
- **O `ClinicObserver`** grava uma senha aleatória longa que ninguém conhece e deixa `password_changed_at` nulo. O auto-cadastro (ADR 028) não muda.
- **`POST /api/admin/clinics/{id}/first-access-link`** (guard `admin`):
  - gera um token aleatório e grava só o hash e a data, o que invalida o link anterior;
  - devolve `{data: {url, created_at}}`, com a URL `/clinica/primeiro-acesso?token=...`;
  - funciona também quando o mestre já tem senha: vira o "link de nova senha" (decisão);
  - a clínica de outro id dá 404, e a clínica sem mestre dá 422.
- **`POST /api/clinic/auth/first-access`** (público, `throttle:clinic-password`):
  - recebe `{token, password, password_confirmation}`, com as mesmas regras de senha do reset;
  - se o hash confere: grava a senha, preenche `password_changed_at` (o que derruba as sessões antigas, pela tarefa 002), apaga o hash e devolve o mesmo envelope do login;
  - token inválido, já usado ou trocado: 422 com mensagem genérica;
  - o link não vence pelo tempo.
- **A resposta de `GET /api/admin/clinics/{id}`** ganha `master_password_defined` e `first_access_link_created_at`.
- **SPA clínica:** a página pública nova `/clinica/primeiro-acesso`, no design system v2, com RHF + Zod e com a base da `ClinicResetPasswordPage`. Ela mostra senha, confirmação e a mensagem de link inválido ("Peça um novo link ao suporte"). Quando dá certo, a sessão abre e a pessoa vai para `/clinica`.

## Critérios de Aceite

- [x] Depois de `POST /api/admin/clinics`, o login do mestre com o documento (com e sem máscara) dá 401 (o teste `AuditAuthCoreTest`/`VerifierAuthCoreTest` da auditoria, invertido)
- [x] O link gerado define a senha e devolve a sessão, e o login com a senha nova dá 200
- [x] O mesmo link usado de novo dá 422
- [x] O link anterior a um link novo dá 422
- [x] O link gerado para o mestre que já tem senha troca a senha e derruba o token antigo
- [x] O guard `clinic` no endpoint do operador dá 401
- [x] O auto-cadastro continua igual: o teste existente segue verde
- [x] A página `/clinica/primeiro-acesso` valida, conclui e mostra o link inválido (teste Vitest)
- [x] Um usuário de outra clínica não consegue gerar nem usar link da clínica A
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `002-troca-de-senha-derruba-sessoes` (Trocar a senha derruba as outras sessões).

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/Clinic/app/Observers/ClinicObserver.php`; `modules/Clinic/app/Services/ClinicRegistrationService.php` (mestre sem documento como senha); `resources/js/pages/clinic/ClinicResetPasswordPage.tsx`
- **Skills:** `backend-clean-code`, `php-testing`, `design-system`, `frontend-ddd`, `frontend-testing`, `api-client`

## Como testar na mão

1. Como operador, crie uma clínica de teste pela API ou pela tela.
2. Tente logar no `/clinica/login` com o e-mail e o CNPJ: deve dar erro.
3. Chame `POST /api/admin/clinics/{id}/first-access-link` e abra a URL devolvida.
4. Defina a senha: você cai em `/clinica`. Abra o mesmo link de novo: deve aparecer "link inválido".
