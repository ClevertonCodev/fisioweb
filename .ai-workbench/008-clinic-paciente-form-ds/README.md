# 008 · Cadastro e edição de paciente da clínica no DS v2

Quem trabalha na clínica cria e edita pacientes na variante A (abas + painel
lateral), gravando pela API em todos os ambientes — no mesmo espírito do ADR
016 e da feature 007 (usuário).

- **Status:** concluída
- **Branch:** `feat/clinic-paciente-novo-ds`
- **Plano:** [`plans/clinic-paciente-form-ds.md`](plans/clinic-paciente-form-ds.md)
- **Módulos:** `modules/Clinic` + `modules/Patient` (dado do paciente); SPA
  `pages/clinic/patient` (`PatientNewPage`, `PatientEditPage`, pasta
  `patient-form/`).

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [001 · Cadastro de paciente vira a tela de verdade](tasks/001-cadastro-vira-tela-real.md) | concluída | | |
| [002 · Edição de paciente vira a tela de verdade](tasks/002-edicao-vira-tela-real.md) | concluída | | |
| [003 · Permissões e isolamento da foto no backend](tasks/003-permissoes-isolamento-foto.md) | concluída | | |

## Pastas

- `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
