# 009 · Harness agy-task (Antigravity + Cursor)

Orquestrar tarefas do fisioweb no Antigravity CLI (`agy`) com as mesmas regras do projeto que o Cursor e o Claude Code já usam, e o Cursor como portão de qualidade (build do frontend + code-review com loop de correção).

- **Status:** concluída (implementação inicial)
- **Branch:** `feat/agy-task-harness`
- **Plano:** [`plans/agy-task-harness.md`](plans/agy-task-harness.md)
- **Módulos:** tooling em `bin/`, `.cursor/commands/`, `.cursor/skills/agy-harness/`, `docs/ai-harness/`

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [001-agy-task-doctor-e-docs](tasks/001-agy-task-doctor-e-docs.md) | concluída | | |
| [002-agy-context-pack-e-manifest](tasks/002-agy-context-pack-e-manifest.md) | concluída | | |
| [003-agy-task-start-e-command](tasks/003-agy-task-start-e-command.md) | concluída | | |
| [004-agy-verify-build-e-code-review](tasks/004-agy-verify-build-e-code-review.md) | concluída | | |
| [005-agy-fix-loop-status-cancel](tasks/005-agy-fix-loop-status-cancel.md) | concluída | | |
| [006-skill-agy-harness-e-smoke-e2e](tasks/006-skill-agy-harness-e-smoke-e2e.md) | concluída | | |

## Pastas

- `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
