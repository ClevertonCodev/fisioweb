# Limite de tentativas no login, no forgot e no reset do admin

**Tipo:** Tarefa
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 25
**Issue:** ainda não criada

## Descrição

Hoje as rotas de login, de "esqueci minha senha" e de redefinir senha do painel admin não têm limite de tentativas, ao contrário das da clínica (reforço da auditoria).

## O que construir

- Limitadores nomeados no módulo Admin, iguais aos da clínica: o login por e-mail + IP, e o forgot e o reset por IP. Eles repassam `Retry-After` como a clínica faz.
- As três rotas públicas do `admin/auth` passam a usar os limitadores.
- O SPA do admin mostra a mensagem de "muitas tentativas" que o `apiClient` já trata no login da clínica, se ainda não mostrar.

## Critérios de Aceite

- [ ] A tentativa seguinte ao limite no login do admin dá 429 com `Retry-After`
- [ ] O mesmo vale no forgot e no reset do admin
- [ ] O login certo antes do limite continua 200
- [ ] Não se aplica caso de outra clínica: a rota não é de clínica
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/Clinic/app/Providers/ClinicServiceProvider.php` (`RateLimiter::for('clinic-login')`); `modules/Clinic/routes/api.php`
- **Skills:** `php-testing`

## Como testar na mão

1. Em `/admin/login`, erre a senha várias vezes seguidas.
2. Depois do limite, a tela mostra "muitas tentativas", e a API responde 429.
