# E-mail do usuário da clínica único sem diferenciar maiúsculas

**Tipo:** Bug
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 40, 41
**Issue:** ainda não criada

## Descrição

Hoje o cadastro e a edição de usuário da clínica conferem a unicidade do e-mail com `=`, que diferencia maiúsculas no Postgres. Já o login e o broker de senha buscam por `LOWER(email)` e pegam o menor id. Um usuário de outra clínica grava `Vitima@` e passa a receber o login e o reset da vítima, que fica sem acesso (achado Médio `clinic/users-email/case-variant-login-collision`).

## O que construir

- O cadastro e a edição de usuário da clínica normalizam o e-mail (`trim` + minúsculas) antes de validar. A unicidade compara `LOWER(email)`, incluindo os excluídos (`withTrashed`), como o auto-cadastro já faz.
- O mestre criado pelo operador grava o e-mail em minúsculas.
- Migration: o índice único de `clinic_users.email` vira um índice único em `LOWER(email)`, no Postgres e no SQLite. Sem conversão de dado (decisão); o checklist de deploy pede para ajustar à mão os e-mails de teste duplicados.

## Critérios de Aceite

- [x] Gravar `Vitima@x.test` com `vitima@x.test` já existente em outra clínica dá 422 no store e no update (o teste `VerifierEmailCaseCollisionTest` da auditoria, invertido)
- [x] O login da vítima continua 200
- [x] O e-mail de usuário excluído também dá 422
- [x] O e-mail é gravado em minúsculas
- [x] O índice recusa a variante de maiúsculas mesmo por fora do request
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/Clinic/app/Http/Requests/RegisterClinicRequest.php` (unicidade com `LOWER` e `withTrashed`); `modules/Clinic/app/Auth/ActiveClinicUserProvider.php`
- **Skills:** `php-testing`, `laravel-eloquent`

## Como testar na mão

1. Como admin da clínica B, edite o próprio e-mail para a variante com maiúsculas do e-mail de um usuário da clínica A.
2. Deve aparecer "Este e-mail já está em uso", e o usuário da A continua entrando.
