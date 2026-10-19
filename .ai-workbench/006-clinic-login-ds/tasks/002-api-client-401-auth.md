# 002 · O 401 das rotas de autenticação vai para a tela

**Plano:** [../plans/clinic-login-ds.md](../plans/clinic-login-ds.md)

## Critérios de aceite

- [x] Senha errada sem sessão: a promessa rejeita com a mensagem da API e a
      página não recarrega.
- [x] Senha errada com sessão aberta: não chama `/auth/refresh` nem repete o
      login.
- [x] `forgot-password` e `reset-password` com 401 não redirecionam.
- [x] Em outra rota, 401 sem sessão continua levando ao login.
- [x] Teste do interceptor visto falhando antes da correção.
