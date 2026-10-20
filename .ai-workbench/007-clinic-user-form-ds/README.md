# 007 · Cadastro e edição de usuário da clínica no DS v2

O administrador cria e edita usuários na mesma tela do Crachá ao vivo. O
cadastro é a tela de verdade (grava pela API, a v1 saiu, tarefa 003); a
edição continua protótipo até o isolamento de usuários e o ADR 019 no
backend.

- **Status:** concluída (falta commit e PR)
- **Branch:** `feat/user-editar-cadastro`
- **Plano:** [`plans/clinic-user-form-ds.md`](plans/clinic-user-form-ds.md)
- **Módulos:** SPA `pages/clinic/user` (cadastro de verdade em
  `UserNewPage` + `user-form/`; edição em `user-edit-prototype/`).
  Backend: só um teste novo em `Clinic` (403 no POST de usuário).

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [001 · Cadastro de usuário no Crachá ao vivo](tasks/001-novo-usuario-crachá.md) | concluída | | |
| [002 · Edição no mesmo layout, sem regressão](tasks/002-edicao-mesmo-layout.md) | concluída | | |
| [003 · Cadastro vira a tela de verdade](tasks/003-cadastro-vira-tela-real.md) | concluída | | |

## Pastas

- `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
