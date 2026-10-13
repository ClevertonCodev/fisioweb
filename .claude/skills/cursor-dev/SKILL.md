---
name: cursor-dev
description: Orquestrar o Cursor como desenvolvedor do fisioweb via plugin cursor@tomas-cursor — Claude planeja (spec/plan/tasks), escreve a tarefa, delega a implementação + testes ao Cursor (Grok 4.6), revisa o diff, roda testes/lint, pede ajustes na mesma sessão, manda o Cursor (Composer 2.5) fazer code review e valida cada achado com teste antes de corrigir. Use quando o usuário pedir para "delegar pro Cursor", "o Cursor implementa", "/cursor-dev", ou quiser o fluxo engenheiro (Claude) + dev (Cursor).
metadata:
  domain: workflow
  triggers: cursor, cursor-agent, delegar, delegate, grok, composer, dev cursor
  scope: orchestration
  related-skills: speckit-specify, speckit-plan, speckit-tasks, php-testing, frontend-testing, security
---

# Cursor como desenvolvedor (fisioweb)

Papéis: **Claude = engenheiro** (planeja, especifica, revisa, aprova, valida review). **Cursor = desenvolvedor** (implementa código + testes) e **revisor secundário** (code review read-only).

Execução via plugin [freema/cursor-plugin-cc](https://github.com/freema/cursor-plugin-cc) (`cursor@tomas-cursor`). Claude chama os **scripts do plugin direto pelo Bash** — `/cursor:review` tem `disable-model-invocation` e proíbe corrigir achados, o que conflita com o passo 7.

```bash
CP=$(ls -d ~/.claude/plugins/cache/tomas-cursor/cursor/*/ | sort -V | tail -1)
```

| Papel | Modelo | Script |
|-------|--------|--------|
| dev | `cursor-grok-4.6-high` | `node "$CP/scripts/delegate.mjs"` / `resume.mjs` |
| review | `composer-2.5` | `node "$CP/scripts/review.mjs"` (read-only, falha se tocar arquivos) |

**Sempre passar o ID completo do modelo.** O alias `grok` do plugin aponta para `grok-4.3`, não 4.6.

O Cursor enxerga as mesmas skills via `.cursor/skills/` (symlinks) e `.cursor/rules/fisioweb-skills.mdc` (alwaysApply).

## Fluxo

### 0. Preparar
- `git status` limpo. Se estiver em `main`, criar branch `feat/<slug>` antes de delegar (o plugin edita a working tree direto, sem worktree).
- Guardar a base: `BASE=$(git rev-parse HEAD)`.

### 1. Planejar (Claude)
- Feature nova → Spec Kit (`speckit-specify` → `speckit-plan` → `speckit-tasks`).
- Mudança pequena → plano curto no próprio arquivo de tarefa.
- Ler o código afetado e as skills relevantes **antes** de escrever a tarefa. Decidir arquivos, contratos, nomes e casos de teste — o Cursor executa, não decide arquitetura.

### 2. Escrever a tarefa
Uma tarefa = um incremento verificável (ex.: uma task do `tasks.md`). Gravar em `tasks/cursor/<slug>.md` (gitignored) com o template de [references/prompts.md](references/prompts.md#tarefa-dev).

### 3. Delegar implementação
```bash
node "$CP/scripts/delegate.mjs" -- "--background --fresh --model cursor-grok-4.6-high Leia e execute a tarefa em tasks/cursor/<slug>.md"
```
Retorna um job id. Acompanhar com `node "$CP/scripts/status.mjs" -- "<job-id>"` e ler com `node "$CP/scripts/result.mjs" -- "<job-id>"`. Tarefa curta: trocar `--background` por `--wait`.

### 4. Revisar (Claude)
1. `git status` + `git diff $BASE` — arquivos fora do escopo? arquivos novos não rastreados?
2. Conferir princípios do `CLAUDE.md`: controller magro, Policy/ownership por `clinic_id`, sem import de internals entre módulos, loader → `application/`, só `apiClient`, `domain/` puro, RHF+Zod.
3. Testes foram escritos e testam comportamento (não só "chama o mock")?
4. Rodar verificações (filtrar pelo que mudou quando der):
   ```bash
   ./vendor/bin/pint --test
   composer run test            # ou php artisan test --filter=...
   npm run types && npm run lint && npm run test
   ```

### 5. Ajustes
Problemas → escrever `tasks/cursor/<slug>-fix-<n>.md` ([template](references/prompts.md#ajuste)) e retomar a **mesma conversa** do Cursor:
```bash
node "$CP/scripts/resume.mjs" -- "--background --model cursor-grok-4.6-high Leia e aplique os ajustes em tasks/cursor/<slug>-fix-<n>.md"
```
Voltar ao passo 4. **Máximo 3 rodadas** — depois disso Claude corrige direto ou reporta o impasse ao usuário.

### 6. Code review pelo Cursor (após aprovação do passo 4)
```bash
node "$CP/scripts/review.mjs" --wait -- "--model composer-2.5 --scope working-tree <foco — ver references/prompts.md#review>"
```
O script monta o diff sozinho (inclui não rastreados). Diff grande → `--background` no lugar de `--wait`, depois `result.mjs -- "<job-id> --json"`.

### 7. Validar achados (Claude) — nunca aceitar no escuro
Para cada finding:
1. Ler o código citado. Se o cenário for impossível (premissa errada, já tratado em outra camada) → **rejeitar** com motivo.
2. Se plausível → **escrever um teste que reproduza** o cenário (PHPUnit ou Vitest). Rodar:
   - Teste **falha** → achado real. Claude corrige o código, teste passa, o teste fica no repo.
   - Teste **passa** → achado falso. Descartar o teste (ou manter se agregar cobertura útil) e rejeitar.
3. Achado sem cenário testável (ex.: legibilidade) → Claude decide pelo mérito, sem teste.

As correções do passo 7 são feitas por Claude, não devolvidas ao Cursor.

### 8. Fechar
- Rodar a bateria completa do passo 4 novamente.
- Reportar ao usuário: o que foi implementado, rodadas de ajuste, achados do review (aceitos com teste / rejeitados com motivo), estado dos testes.
- **Não commitar** sem o usuário pedir.

## Regras
- Nunca usar `delegate.mjs`/`resume.mjs` para review — review só via `review.mjs`.
- O Cursor não commita, não faz push, não roda `migrate:fresh`/`db:wipe`, não instala dependência sem estar na tarefa.
- Se o Cursor mexer em arquivo fora do escopo, reverter esse arquivo (`git checkout -- <arquivo>`) e registrar no ajuste.
- Jobs em background da sessão são cancelados pelo hook `SessionEnd` do plugin ao fechar o Claude Code.
- Logs NDJSON completos ficam em `~/.claude/plugins/data/cursor-tomas-cursor/state/jobs/`.
