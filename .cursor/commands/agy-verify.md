---
description: Portão de qualidade após job Antigravity (build + code-review JSON)
---

Rode **depois** de `bin/agy-task start` concluir. Não edite código neste command salvo para gerar `review.json`.

## Passos

1. Identifique o **job-id** (`bin/agy-task status` ou pasta em `.ai-workbench/_agy-jobs/`).
2. Siga o mesmo espírito de `/code-review` (regras em `.cursor/commands/code-review.md`): bugs, regressões, security/clinic_id, arquitetura fisioweb, testes.
3. Escreva o relatório em markdown para o usuário **e** grave JSON estruturado em:

   `.ai-workbench/_agy-jobs/<job-id>/review.json`

## Formato `review.json`

```json
{
  "verdict": "pass",
  "findings": [
    {
      "severity": "high",
      "title": "Resumo curto",
      "scenario": "entrada → resultado errado → esperado",
      "suggestion": "como testar"
    }
  ]
}
```

- `severity`: `critical` | `high` | `medium` | `low` | `info`
- `verdict`: `pass` se não houver achados **critical**, **high** ou **medium**; senão `fail`

4. Execute:

```bash
bin/agy-task verify <job-id>
```

Se FAIL e ainda houver voltas: `bin/agy-task fix-loop <job-id>` (máx. 3).

Não rode revisão adversária completa do repo aqui — este é o portão do fluxo agy.
