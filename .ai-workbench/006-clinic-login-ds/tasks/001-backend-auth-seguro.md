# 001 · Login e senha da clínica com limite, resposta neutra e inativo barrado

**Plano:** [../plans/clinic-login-ds.md](../plans/clinic-login-ds.md)

## Critérios de aceite

- [x] `POST /api/clinic/auth/login`: a 6.ª tentativa no mesmo minuto, com o
      mesmo e-mail e IP, responde 429 com mensagem em português.
- [x] `POST /api/clinic/auth/forgot-password` e `reset-password`: a 6.ª
      chamada no mesmo minuto, do mesmo IP, responde 429.
- [x] `forgot-password` responde 200 com a **mesma** mensagem para e-mail com
      conta, sem conta e quando o broker segura um novo pedido.
- [x] `reset-password` com token errado responde igual (422, mesma
      mensagem) para e-mail com conta e sem conta.
- [x] A chave do limite do login não quebra com `email` que não é texto
      (422 de validação) e o 429 traz `Retry-After`.
- [x] Usuário da clínica com `status` 0 e senha certa recebe 403 com mensagem
      de acesso desativado, e nenhum token válido sai da resposta.
- [x] Usuário ativo continua entrando (200 com token).
- [x] O admin continua funcionando (o controlador base é compartilhado): testes
      de `modules/Admin` passam, ajustados para a resposta neutra.
- [x] Testes que reproduzem cada achado, vistos falhando antes da correção.
