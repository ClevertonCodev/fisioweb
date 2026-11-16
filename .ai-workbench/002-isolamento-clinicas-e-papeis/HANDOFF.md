# Handoff — feature 002 (isolamento entre clínicas e papéis)

Atualizado em 2026-11-11: as 20 tarefas estão concluídas e commitadas; 013 a 020 sem push. Falta o code review da feature (se o usuário quiser), o push e a PR.

## Onde está

Branch `feat/002-isolamento-clinicas-e-papeis`, worktree `fisioweb-002-isolamento-clinicas-e-papeis`.

| Tarefa | Estado | Commit | Revisão adversária |
|---|---|---|---|
| 001 a 012 | concluídas, com push | — | — |
| 013 | concluída, **sem push** | `fd0c761` | APROVADO COM RESSALVAS (1 rodada) |
| 014 | concluída, **sem push** | `08b738d` | APROVADO (1 rodada) |
| 015 | concluída, **sem push** | `bac24d7` | REPROVADO → APROVADO (2 rodadas) |
| 016 | concluída, **sem push** | `e808ffe` | REPROVADO → APROVADO (2 rodadas) |
| 017 | concluída, **sem push** | `5e7100e` | REPROVADO → REPROVADO → APROVADO (3 rodadas) |
| 018 | concluída, **sem push** | `adb25a1` | APROVADO COM RESSALVAS → APROVADO (2 rodadas) |
| 019 | concluída, **sem push** | `6ec31ef` | REPROVADO → APROVADO COM RESSALVAS → APROVADO (3 rodadas) |
| 020 | concluída, **sem push** | `e2e2404` | APROVADO COM RESSALVAS → APROVADO (2 rodadas) |

## A 017

Concluída. Decisões da revisão em `review/017-seletor-do-operador-e-sync-por-evento/decisoes.md`. O usuário confirmou em 2026-11-11 que a troca de imagens feita pelo operador atualiza todos os exercícios ligados (critério 1 e plano reescritos). Minor para a PR: ACHADO-202 (ternário no `ExerciseController::options`).

## A 018

Concluída. O usuário decidiu em 2026-11-11 que o operador não rejeita exercício já aprovado (422), registrado no ADR 029. Para a 020 ficaram no `DEFERRED.md` da feature: a atomicidade da trava e do reject, o `onError` da tela de revisão e a proposta órfã.

## A 019

Concluída. O usuário decidiu criar a rota da clínica para a capa de vídeo concluído. A revisão achou o caminho da mídia proposta saindo para outra clínica pelo `metadata` do vídeo: o `Video::toArray` virou lista branca (`PUBLIC_METADATA_KEYS`), e o admin recebe o `metadata` inteiro por `toAdminArray()`. Os usuários de QA 36, 37, 38 e 52 do banco local ficaram com a senha de QA da sessão.

## Como retomar

Numa sessão nova, nesta pasta: "continue a 020 da feature 002 pelo HANDOFF.md". Os itens do `DEFERRED.md` da feature marcados "para a 020" (atomicidade da trava e do reject, `onError` da tela de revisão, proposta órfã, proposta antiga em vídeo que voltou a ficar livre) são para decidir nela. O workflow sequencial usado da 015 à 017 (um subagente por etapa: implementar, revisor, verificador, registrar/corrigir, commit) está em:

`~/.claude/projects/-Users-clevertonsantos-Documents-GitHub-fisioweb-002-isolamento-clinicas-e-papeis/99d32159-eaaa-4490-a033-ce051cc70454/workflows/scripts/feature-002-tarefas-014-a-017-wf_4c5a7d18-89f.js`

Para reaproveitar o script, troque a lista `TASKS` e avise no prompt de implementar que já existe trabalho parcial na árvore.

## Pendências do usuário

- Push das tarefas 013 a 020.
- Code review da feature inteira (`bin/code-review`, numa sessão separada), se o usuário quiser.
- A janela do aprovar de exercício pendente durante a troca de mídia (DEFERRED da feature, tarefa 020): outra tarefa, porque muda o contrato do `PUT /admin/exercises/{id}/approve`.
- Se a 001 (`/log-viewer`) sai numa PR separada.
- Na PR: os Minor de cada tarefa estão nos `review/<tarefa>/decisoes.md`, e o teste do Google com credenciais de homologação (014) está no `DEFERRED.md` da feature.
- Entraram no `DEFERRED.md` da raiz nesta sessão:
  - `whereUuid` nas rotas de `publicToken` (015);
  - `deleteFile` do vídeo, que ignora o retorno do R2 (016);
  - `clinic_user` inteiro na listagem de arquivos do prontuário (016);
  - teste intermitente `FinanceOpeningBalanceChainTest` (factory de categoria com nome repetido), 2026-11-11.
- Entraram no `DEFERRED.md` da feature na 017: o `video_id` direto do operador no store/update de exercício e o `ExerciseReferenceImageSyncService` sem repository.
