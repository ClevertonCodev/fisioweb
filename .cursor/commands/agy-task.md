---
description: Delegar implementação ao Antigravity (agy) com regras do fisioweb
---

Use **somente** quando o usuário pediu o caminho Antigravity (`/agy-task`). O chat normal continua no Cursor.

## Antes de start

1. Confirme o arquivo de tarefa em `.ai-workbench/<feature>/tasks/NNN-*.md`.
2. Pergunte o modelo (obrigatório):
   - **Claude Opus 5.5 (High)** → `claude-opus-5-5-high`
   - **Gemini 4 Argon (High)** → `gemini-4-argon-high`
3. Rode `bin/agy-task doctor` se o ambiente nunca foi validado nesta máquina.

## Disparar o job

```bash
bin/agy-task start --task <caminho-da-tarefa.md> --model <modelo-id>
```

Background (tarefa longa):

```bash
bin/agy-task start --task <tarefa.md> --model <modelo-id> --background
bin/agy-task status
bin/agy-task result
```

Não implemente a mesma tarefa no Cursor em paralelo. Não faça `git commit`/`git push` pelo usuário após o agy.

## Depois do agy

1. Usuário revisa o diff no git.
2. Rode **`/agy-verify`** (command separado) para build + code-review estruturado.
3. Se verify FAIL: `bin/agy-task fix-loop <job-id>` (até 3 voltas).

Plano: `.ai-workbench/009-agy-task-harness/plans/agy-task-harness.md`
