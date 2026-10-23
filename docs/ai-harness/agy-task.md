# Harness agy-task (Antigravity + Cursor)

Orquestra trabalho no **Antigravity CLI** (`agy`) no mesmo checkout do fisioweb, com regras do projeto injetadas por scripts. O **Cursor** dispara via **`/agy-task`**; o portão de qualidade é **`/agy-verify`**.

Plano: [`.ai-workbench/009-agy-task-harness/plans/agy-task-harness.md`](../../.ai-workbench/009-agy-task-harness/plans/agy-task-harness.md).

## O que não fazemos

- Proxy / túnel / override de Base URL no Cursor.
- Catálogo genérico de skills externas no repo.
- `git commit` / `git push` automáticos pelo harness.

## Pré-requisitos

```bash
bin/agy-task doctor
```

Modelos: `claude-opus-5-5-high`, `gemini-4-argon-high`.

## Comandos

| Comando | Descrição |
|---------|-----------|
| `bin/agy-task doctor` | Valida ambiente |
| `bin/agy-context-pack --task <t.md> --out-dir <dir>` | Gera `agy-context.md` |
| `bin/agy-task start --task <t.md> --model <id> [--background]` | Job agy com edição |
| `bin/agy-task verify <job-id>` | `npm run build` + `review.json` |
| `bin/agy-task fix-loop <job-id>` | Correção agy (máx. 3) |
| `bin/agy-task status [job-id]` | Status |
| `bin/agy-task result [job-id]` | Log / meta |
| `bin/agy-task cancel <job-id>` | Cancela background |

Jobs: `.ai-workbench/_agy-jobs/<id>/` (gitignored).

## `review.json`

Gravado pelo agente Cursor ao rodar `/agy-verify`:

```json
{
  "verdict": "pass",
  "findings": [
    {
      "severity": "high",
      "title": "Resumo",
      "scenario": "entrada → errado → esperado",
      "suggestion": "teste sugerido"
    }
  ]
}
```

Severidades: `critical`, `high`, `medium`, `low`, `info`.  
`bin/agy-task verify` falha se existir achado **critical**, **high** ou **medium**.

Interpretação: `bin/agy-review-check.py <review.json>`.

## Paridade com Cursor

- Núcleo: `docs/ai-harness/agy-context-core.md`
- Manifest: `.agy/skills-manifest.json`
- Pack: `bin/agy-context-pack` (inclui `AGENTS.md` + skills)

## Testes shell

```bash
bash tests/bin/agy-task-doctor_test.sh
bash tests/bin/agy-context-pack_test.sh
bash tests/bin/agy-review-check_test.sh
bash tests/bin/agy-task-fix-loop_test.sh
```

`bin/verificar.sh` roda os testes `tests/bin/agy-*` quando arquivos `bin/agy*` mudaram.

## Variáveis úteis

| Variável | Efeito |
|----------|--------|
| `AGY_TASK_DRY_RUN=1` | Não chama agy de verdade |
| `AGY_TASK_SKIP_DOCTOR=1` | Pula doctor no `start` |
| `AGY_CMD` | Substitui binário agy (testes) |
| `AGY_PRINT_TIMEOUT` | Timeout do `agy -p` (default 30m) |

## Cursor commands

- `.cursor/commands/agy-task.md`
- `.cursor/commands/agy-verify.md`

Skill: `agy-harness`.
