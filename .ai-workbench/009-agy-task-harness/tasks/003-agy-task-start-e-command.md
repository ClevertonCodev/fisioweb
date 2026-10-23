# Iniciar job Antigravity (start) e command /agy-task

**Tipo:** História
**Plano:** `../plans/agy-task-harness.md`
**Issue:** ainda não criada

## Descrição

O desenvolvedor dispara `/agy-task`, escolhe Opus High ou Argon High, e o Antigravity implementa a tarefa no repo com edição nos arquivos. Esta fatia liga context pack, `agy -p`, jobs em evidence e o command do Cursor.

## O que construir

Subcomandos `bin/agy-task start` com argumentos: caminho da tarefa em `.ai-workbench/.../tasks/*.md`, modelo (`claude-opus-5-5-high` | `gemini-4-argon-high`), opção background. Antes do `agy`, chamar `agy-context-pack`. Invocar `agy -p` com `--mode accept-edits` e `--dangerously-skip-permissions` apenas neste subcomando; timeout configurável. Persistir em `.ai-workbench/<feature>/evidence/agy-task-<id>/` (ou `_agy-jobs`): `meta.json`, `log`, `pid` se background. Command `.cursor/commands/agy-task.md` instruindo o agente Cursor a perguntar modelo e chamar o script (não substituir implementação fora deste command). Proibir no prompt instrução de `git commit`/`git push`.

## Critérios de Aceite

- [x] `bin/agy-task start` roda com tarefa de teste e produz log em evidence
- [x] Modelos restritos aos dois IDs acordados no plano
- [x] Job usa conteúdo de `agy-context.md` do passo de context pack
- [x] `/agy-task` documentado em `.cursor/commands/agy-task.md`
- [x] Histórias 1–7 e 16–18 do plano cobertas nesta fatia
- [x] Definição de Pronto cumprida (smoke em evidence com SUMMARY mínimo do job de teste)

## Depende de

- `002-agy-context-pack-e-manifest` (pacote de contexto).

## Notas de Implementação

- **Branch:** `feat/agy-task-harness`
- **Exemplo no código:** padrão mental codex-plugin (jobs locais); `bin/verificar.sh` para estilo shell
- **Skills:** `agy-harness` (esboço pode vir na 006; command pode citar plano 009)

## Como testar na mão

Criar tarefa smoke (editar comentário em arquivo de teste ou marker em path ignorado). Rodar `/agy-task` no Cursor ou `bin/agy-task start` no terminal; verificar diff e log em evidence.
