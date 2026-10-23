# Skill agy-harness, espelho Claude e smoke ponta a ponta

**Tipo:** Tarefa
**Plano:** `../plans/agy-task-harness.md`
**Issue:** ainda não criada

## Descrição

Fechar o harness para uso diário: skill canônica, paridade `.claude`/`.cursor`, entrada no mapa de skills, smoke e2e documentado em evidence.

## O que construir

Skill `.cursor/skills/agy-harness/SKILL.md` (cópia idêntica em `.claude/skills/agy-harness/`) explicando quando usar `/agy-task` vs `implementar-tarefa` no Cursor, modelos, loop de 3x, e que revisão adversária do repo não substitui o portão verify no caminho agy. Linha na tabela de skills em `fisioweb-skills.mdc` / `AGENTS.md` se necessário (mínimo). Rodar `bash bin/verificar-skills.sh`. Smoke e2e: doctor → context-pack → start (tarefa mínima) → verify → (opcional) um fix-loop; `SUMMARY.md` em `.ai-workbench/009-agy-task-harness/evidence/agy-task-smoke/`. Integrar teste shell de context pack ao que `bin/verificar.sh` já roda, se couber sem inflar CI.

## Critérios de Aceite

- [x] Skill `agy-harness` nas duas árvores e `bin/verificar-skills.sh` OK
- [x] Smoke e2e documentado em evidence com SUMMARY (sem dado de paciente)
- [x] Histórias 13–15 e 20 do plano cobertas
- [x] README da feature 009 atualizado com tarefas em andamento/concluídas conforme estado real
- [x] Definição de Pronto cumprida para a feature de harness

## Depende de

- `005-agy-fix-loop-status-cancel` (fluxo completo).

## Notas de Implementação

- **Branch:** `feat/agy-task-harness`
- **Exemplo no código:** `.cursor/skills/implementar-tarefa/SKILL.md`, `.cursor/skills/revisao-adversaria/SKILL.md`
- **Skills:** `implementar-tarefa`, `revisao-adversaria` (contraste no texto da agy-harness)

## Como testar na mão

Seguir SUMMARY do smoke: disparar `/agy-task` numa micro-tarefa, `/agy-verify`, confirmar build verde e review PASS ou loop documentado.
