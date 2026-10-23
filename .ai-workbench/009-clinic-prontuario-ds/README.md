# 009 · Prontuário do paciente no design system v2

O prontuário em `/clinica/pacientes/:id` deixa a v1 e vira o painel B, com
consultas e programas filtrados na API, ações que gravam de verdade e o
link do questionário com token.

- **Status:** planejada
- **Branch:** `feat/clinic-prontuario-ds`
- **Plano:** [`plans/clinic-prontuario-ds.md`](plans/clinic-prontuario-ds.md)
- **Módulos:** `ClinicScheduling` (`patient_id` no index),
  `ClinicQuestionnaire` (token e URL pública), `TreatmentProgram` (front
  passa `patient_id`). SPA: `pages/clinic/patient` (prontuário),
  `pages/clinic/program` (paciente pré-selecionado no cadastro),
  `application/clinic`, `infrastructure/`, `domain/clinic`.

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [001 · Consultas e programas por paciente, e os números](tasks/001-consultas-e-programas-por-paciente.md) | implementada (review no final) | | |
| [002 · Token no link público do questionário](tasks/002-token-do-questionario.md) | implementada (review no final) | | |
| [003 · Painel B vira a tela de verdade (leitura)](tasks/003-painel-b-vira-tela-real.md) | implementada (review no final) | | |
| [004 · Ações que gravam e o link do questionário](tasks/004-acoes-que-gravam-e-o-link.md) | a fazer | | |

## Pastas

- `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
