# 010 · Formulários do prontuário no DS v2

Evolução, avaliação, envio de questionário e envio de arquivo deixam os
overlays da v1 e os protótipos que não gravam, e viram as telas v2
escolhidas, gravando pela API.

- **Status:** implementação pronta; revisão adversária na 3ª rodada (RESSALVAS corrigidas, sem 4ª rodada)
- **Branch:** `feat/clinic-prontuario-formularios-ds`
- **Plano:** [`plans/clinic-prontuario-formularios-ds.md`](plans/clinic-prontuario-formularios-ds.md)
- **Decisões:** [`decisoes.md`](decisoes.md)
- **Módulos:** `ClinicalRecord`, `ClinicQuestionnaire`. SPA:
  `pages/clinic/patient` (prontuário, avaliação nova, ficha).

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [001 · Nova evolução vira a Folha](tasks/001-nova-evolucao-folha.md) | implementação pronta | | |
| [002 · Nova avaliação vira a Prévia](tasks/002-nova-avaliacao-previa.md) | implementação pronta | | |
| [003 · Responder avaliação vira Ficha e laudo](tasks/003-ficha-e-laudo.md) | implementação pronta | | |
| [004 · Enviar questionário vira Escolher e prever](tasks/004-enviar-questionario.md) | implementação pronta | | |
| [005 · Enviar arquivo vira Foto do documento](tasks/005-enviar-arquivo.md) | implementação pronta | | |

## Pastas

- `decisoes.md`, `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
