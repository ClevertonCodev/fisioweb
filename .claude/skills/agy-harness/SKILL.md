---
name: agy-harness
description: Orquestra tarefas do fisioweb no Antigravity CLI (agy) via /agy-task, com portão /agy-verify no Cursor. Use quando o usuário escolher o caminho Antigravity; não substitui implementar-tarefa no fluxo normal.
---

# Harness agy-task

## Quando usar

- Usuário rodou **`/agy-task`** ou pediu explicitamente Antigravity para a tarefa.
- **Não** use em implementação normal no chat — assuma **Cursor** + `implementar-tarefa`.

## Modelos (perguntar sempre)

- `claude-opus-5-5-high`
- `gemini-4-argon-high`

## Fluxo

1. `bin/agy-task doctor` (primeira vez na máquina).
2. `bin/agy-task start --task <.ai-workbench/.../tasks/NNN.md> --model <id>`  
   Contexto: `bin/agy-context-pack` (automático no start).
3. Usuário revisa diff no git.
4. **`/agy-verify`** — gera `review.json` no job + `bin/agy-task verify <job-id>`.
5. Se FAIL: `bin/agy-task fix-loop <job-id>` (máx. **3** voltas).

Jobs em `.ai-workbench/_agy-jobs/<id>/` (gitignored).

## vs revisão adversária

No caminho **agy**, o portão é **build FE + code-review estruturado**, não a skill `revisao-adversaria` completa. No caminho **Cursor**, `implementar-tarefa` + `revisao-adversaria` continuam valendo.

## Referências

- `docs/ai-harness/agy-task.md`
- `.cursor/commands/agy-task.md`, `agy-verify.md`
- Plano: `.ai-workbench/009-agy-task-harness/plans/agy-task-harness.md`
