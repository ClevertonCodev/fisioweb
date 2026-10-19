# 006 · Login, recuperar e redefinir senha da clínica no DS v2

As três telas públicas da clínica passam para o design system v2 (variante A
do protótipo), e o login e a recuperação de senha ficam seguros: limite de
tentativas, resposta que não revela quem tem conta, usuário desativado barrado
e o erro de senha aparecendo na tela.

- **Status:** concluída (revisão adversária APROVADA na rodada 2), não commitada
- **Branch:** `feat/clinic-programas-historico-ds` (pedido do usuário: "nessa
  branch mesmo")
- **Plano:** [`plans/clinic-login-ds.md`](plans/clinic-login-ds.md)
- **Módulos:** `modules/Clinic` (rotas e AuthController), `app/` (controladores
  base de auth e de senha, compartilhados com o admin); SPA
  `pages/clinic`, `components/clinic/auth`, `application/clinic`,
  `infrastructure/api/client.ts`

## Tarefas

| Tarefa | Status |
|---|---|
| [001 · Login e senha com limite, resposta neutra e inativo barrado](tasks/001-backend-auth-seguro.md) | pronta |
| [002 · O 401 das rotas de autenticação vai para a tela](tasks/002-api-client-401-auth.md) | pronta |
| [003 · Login, recuperar e redefinir senha no DS v2](tasks/003-telas-auth-v2.md) | pronta |

## Pastas

- `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
