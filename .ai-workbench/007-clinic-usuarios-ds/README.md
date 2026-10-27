# 007 · Lista de usuários da clínica no design system v2

A lista de usuários deixa a tabela v1 e vira os cartões e as funções do
protótipo C, com filtros na URL, mudança de função de verdade e desativar ou
excluir com confirmação — só o administrador, e sem rebaixar o mestre nem o
último admin ativo.

- **Status:** implementada; revisão adversária em 3 rodadas, encerrada por decisão do usuário (ver `review/001-004/decisoes.md`, fora do git); sem commit
- **Branch:** `feat/user-listagem-ds`
- **Plano:** [`plans/clinic-usuarios-ds.md`](plans/clinic-usuarios-ds.md)
- **Módulos:** `modules/Clinic` (`ClinicUser`, service, Policy, FormRequest,
  controller); SPA `pages/clinic/user`, `domain/clinic`, `application/clinic`,
  `infrastructure/repositories`

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [001 · Listagem com 2FA/Google, PUT parcial e travas de mestre e último admin](tasks/001-listagem-e-put-parcial.md) | concluída (sem PR) | | |
| [002 · Lista v2 em cartões e sanfona substitui a v1](tasks/002-lista-v2-em-cartoes.md) | concluída (sem PR) | | |
| [003 · Mudar função de verdade (arraste, dropdown e modal)](tasks/003-mudar-funcao.md) | concluída (sem PR) | | |
| [004 · Desativar, reativar e excluir pelo drawer](tasks/004-desativar-reativar-excluir.md) | concluída (sem PR) | | |

## Decisões tomadas durante a implementação

- 2026-10-20 · O sinal de verificação em duas etapas ficou fora da tela (ADR 019; 2FA não existe no backend).
- 2026-10-20 · Revisão adversária: desativar passa a cortar a sessão aberta (provider do guard `clinic`) e excluir vira soft delete, com o histórico preservado ([ADR 022](../../docs/adr/022-usuario-da-clinica-desativar-corta-sessao-excluir-e-soft-delete.md)). Com isso a tarefa 004 ganhou uma migration (`deleted_at` em `clinic_users`).

## Pastas

- `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
