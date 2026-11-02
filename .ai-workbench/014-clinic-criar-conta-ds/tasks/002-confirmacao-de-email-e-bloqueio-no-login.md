# Confirmação de e-mail, backfill de usuários atuais e bloqueio no login

**Tipo:** História
**Plano:** `../plans/clinic-criar-conta-ds.md`
**Histórias:** 7, 8, 9, 10, 11, 12
**Issue:** ainda não criada

## Descrição

Para que o auto-cadastro só libere o painel depois da confirmação do e-mail sem trancar quem já usa o sistema, é preciso preencher `email_verified_at` nos usuários existentes, garantir que criações feitas pelo admin já nasçam confirmadas, disponibilizar os endpoints de confirmação e reenvio de e-mail e barrar no login quem ainda não confirmou (somente após validar a senha).

## O que construir

No módulo `Clinic`, criar a migration que preenche `email_verified_at` nos registros atuais de `clinic_users` que estão nulos, e ajustar `ClinicObserver::created` e `ClinicUserService::create` para gravarem `email_verified_at = now()`. Implementar `POST /api/clinic/auth/verify-email` validando a assinatura HMAC, validade de 24 h e hash do e-mail (idempotente quando já confirmado; `422` quando inválido, expirado ou de outro usuário) e `POST /api/clinic/auth/verify-email/resend` com resposta sempre neutra e envio em fila apenas para usuário pendente de confirmação. Em `AuthController`, após `attempt` validar a senha, impedir o login de usuário com `email_verified_at` nulo retornando `403` com a mensagem de confirmação. Registrar o ADR `028-auto-cadastro-da-clinica-com-confirmacao-de-email.md`.

## Critérios de Aceite

- [x] A migration preenche `email_verified_at` em todos os `clinic_users` existentes que estavam com valor nulo, e clínicas/usuários criados pelo admin já nascem com `email_verified_at` preenchido.
- [x] `POST /api/clinic/auth/login` barra usuário com `email_verified_at` nulo (com a senha certa) retornando `403` e mensagem orientando a confirmar o e-mail; com senha errada continua retornando `401` `"Credenciais inválidas."`; após confirmar o e-mail, o login retorna `200` com token.
- [x] `POST /api/clinic/auth/verify-email` confirma o e-mail com link assinado válido, responde `200` idempotente se o link for reutilizado, e responde `422` se o link estiver vencido, com assinatura adulterada ou com hash de outro e-mail.
- [x] `POST /api/clinic/auth/verify-email/resend` devolve a mesma mensagem `200` para e-mail inexistente, já confirmado ou pendente, enfileirando o e-mail apenas para o pendente.
- [x] ADR `docs/adr/028-auto-cadastro-da-clinica-com-confirmacao-de-email.md` criado.
- [x] Um usuário de outra clínica não consegue confirmar nem interferir na conta de outra clínica com assinatura inválida.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `001-auto-cadastro-clinica-e-slug-disponivel` (Auto-cadastro da clínica e consulta de disponibilidade de endereço)

## Notas de Implementação

- **Branch:** `feat/clinic-criar-conta-ds`
- **Exemplo no código:** `modules/Clinic/app/Http/Controllers/AuthController.php`, `app/Http/Controllers/BasePasswordResetController.php`, `modules/Clinic/app/Observers/ClinicObserver.php`
- **Skills:** `backend-clean-code`, `php-modern`, `laravel-queues`, `security`, `php-testing`, `domain-modeling`

## Como testar na mão

1. Criar uma clínica via `POST /api/clinic/auth/register` e tentar logar em `POST /api/clinic/auth/login` com a senha certa: deve responder `403` pedindo confirmação do e-mail.
2. Usar os parâmetros do link gerado no log para chamar `POST /api/clinic/auth/verify-email`: deve responder `200`, e chamar novamente deve continuar respondendo `200`.
3. Logar novamente em `POST /api/clinic/auth/login`: deve responder `200` com `access_token`.
