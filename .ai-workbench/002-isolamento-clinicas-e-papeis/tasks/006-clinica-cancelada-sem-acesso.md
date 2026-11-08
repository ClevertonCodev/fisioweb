# Clínica cancelada não loga, perde as sessões e não se reativa sozinha

**Tipo:** Bug
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 22, 23, 24
**Issue:** ainda não criada

## Descrição

Hoje a clínica que o operador cancelou continua logando, e o mestre se reativa sozinho mandando `status` no `PUT /clinic/profile` (reforço da auditoria, aceito antes no DEFERRED da 006).

A abordagem é recusar o usuário de clínica cancelada no login e em cada requisição, e tirar `status` do perfil.

## O que construir

- Só `Clinic::STATUS_CANCELLED` bloqueia. A clínica `STATUS_INACTIVE` continua entrando (decisão).
- Login da clínica: o usuário de clínica cancelada com a senha certa leva 403 ("A clínica está cancelada. Fale com o suporte."), depois da senha conferida, como as outras recusas.
- Provider do guard `clinic`: devolve nulo para o usuário de clínica cancelada, o que corta as rotas autenticadas e o refresh.
- O `PUT /api/clinic/profile` ignora `status`, que sai das regras do request. O SPA de dados da clínica para de mandar o campo.
- O `login-as` do operador em clínica cancelada responde 422 ("A clínica está cancelada. Reative-a para entrar."), sem exceção para o token de impersonação (decisão).

## Critérios de Aceite

- [ ] O usuário de clínica cancelada leva 403 no login com a senha certa e a mensagem certa
- [ ] O token emitido antes do cancelamento dá 401 em `/me`, numa rota da clínica e no refresh
- [ ] O usuário de clínica inativa continua logando (200)
- [ ] O `PUT /api/clinic/profile` ignora `status`. O teste usa uma clínica ativa que manda `status=-1` e confere que ela continua ativa. Não dá para testar com uma clínica cancelada, porque o mestre dela já leva 401.
- [ ] O `login-as` em clínica cancelada dá 422
- [ ] O link de primeiro acesso (`POST /api/clinic/auth/first-access`) do mestre de clínica cancelada dá o 422 genérico e não troca a senha (vem da revisão da 003)
- [ ] Reativar pelo operador devolve o acesso
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/Clinic/app/Http/Controllers/AuthController.php` (`canLogIn`); `modules/Clinic/app/Auth/ActiveClinicUserProvider.php`; `modules/Clinic/app/Http/Controllers/Admin/ClinicController.php` (`loginAs`)
- **Skills:** `backend-clean-code`, `php-testing`, `frontend-ddd`

## Como testar na mão

1. Como operador, cancele uma clínica de teste com um usuário logado nela.
2. A aba do usuário cai no login na próxima ação, e o login mostra "A clínica está cancelada".
3. Tente o "entrar como" pela lista de clínicas do admin: aparece o erro de clínica cancelada.
4. Reative a clínica: o login volta a funcionar.
