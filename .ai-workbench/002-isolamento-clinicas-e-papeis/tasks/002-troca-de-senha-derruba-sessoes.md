# Trocar a senha derruba as outras sessões (clínica e admin)

**Tipo:** Bug
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 19, 20, 21
**Issue:** ainda não criada

## Descrição

Hoje redefinir ou trocar a senha não invalida os JWT e os refresh já emitidos: quem roubou um token continua entrando (achado Baixo da auditoria, que também fecha o pré-sequestro de conta no auto-cadastro).

A abordagem é guardar quando a senha mudou e recusar todo token emitido antes disso, nos guards `clinic` e `admin`. Ela vem antes do mestre porque o primeiro acesso usa a mesma marca.

## O que construir

- Migration: `password_changed_at` em `clinic_users` (módulo Clinic) e em `users` (módulo Admin), nula. Sem conversão de dado.
- Toda troca de senha preenche `password_changed_at`:
  - o reset pelo broker (clínica e admin);
  - a edição de usuário da clínica com `password`, seja pelo próprio usuário ou pelo admin;
  - qualquer outro caminho que grave senha.
- Um token cujo `iat` é anterior a `password_changed_at` é recusado com 401 em toda rota autenticada e no refresh, nos guards `clinic` e `admin`.
- Quem troca a **própria** senha pela edição de usuário recebe um `access_token` novo na mesma resposta e continua logado. O SPA guarda o token novo. Quando o admin troca a senha de outra pessoa, a resposta não traz token.
- Nenhuma mudança no guard `patient` (o paciente não troca a senha).

## Critérios de Aceite

- [x] Depois do reset da clínica, o token antigo dá 401 em `/api/clinic/auth/me` e em `/refresh` (o teste da auditoria, invertido)
- [x] O mesmo no admin: depois do reset, o token antigo dá 401 em `/api/admin/auth/me` e no refresh
- [x] O admin troca a senha de um fisio: o token do fisio dá 401, e o do admin continua 200
- [x] O usuário troca a própria senha: a resposta traz um `access_token` novo, que dá 200, e o antigo dá 401
- [x] O SPA da edição de usuário guarda o token novo e não desloga quem trocou a própria senha (teste Vitest)
- [x] O token de outra clínica não é afetado
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/Clinic/app/Auth/ActiveClinicUserProvider.php` (recusa a cada requisição); `app/Http/Controllers/BasePasswordResetController.php`
- **Skills:** `php-testing`, `laravel-eloquent`, `api-client`, `frontend-testing`

## Como testar na mão

1. Faça login como fisio da clínica A em dois navegadores (ou num navegador e numa janela anônima). Abas do mesmo navegador dividem o token e continuam logadas juntas.
2. Num deles, troque a própria senha pela edição do usuário: ele continua funcionando.
3. Recarregue o outro: ele cai no login.
4. Pela API, faça o reset de um admin do painel e confira 401 com o token antigo.
