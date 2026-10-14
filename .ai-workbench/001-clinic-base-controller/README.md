# 001 · Controller base para o guard clinic

Tira a repetição de `Auth::guard('clinic')->user()` dos controllers dos módulos de clínica com um controller base compartilhado. Quem mantém o backend ganha código mais curto e comparação de `clinic_id` padronizada, e a clínica continua isolada como hoje.

- **Status:** em andamento
- **Branch:** `feat/clinic-base-controller`
- **Plano:** [`plans/clinic-base-controller.md`](plans/clinic-base-controller.md)
- **Módulos:** núcleo `app/Http/Controllers`, `Clinic`, `ClinicFinance`, `ClinicScheduling`, `ClinicalRecord`, `ClinicQuestionnaire`, `TreatmentProgram`, `GoogleCalendar`, `tests/Architecture`. O SPA não muda.

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [001 · Controller base + Patient, ClinicProfile, Exercise](tasks/001-controller-base-e-modulo-clinic.md) | concluída | | |
| [002 · Rede + migração de ClinicUser e Dashboard](tasks/002-clinic-user-e-dashboard.md) | a fazer | | |
| [003 · Rede + migração de ClinicFinance](tasks/003-clinic-finance.md) | a fazer | | |
| [004 · Migrar ClinicScheduling e TreatmentProgram](tasks/004-clinic-scheduling-e-treatment-program.md) | a fazer | | |
| [005 · Rede + migração de ClinicalRecord](tasks/005-clinical-record.md) | a fazer | | |
| [006 · Rede + migração de ClinicQuestionnaire](tasks/006-clinic-questionnaire.md) | a fazer | | |
| [007 · Rede + migração de GoogleCalendar](tasks/007-google-calendar.md) | a fazer | | |
| [008 · Teste de arquitetura contra acesso direto ao guard](tasks/008-trava-de-arquitetura.md) | a fazer | | |

## Pastas

- `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
