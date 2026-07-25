# Implementation Plan: Patient Program Experience (Backend)

**Branch**: `feature/area-paciente` (`015-patient-program-experience`) | **Date**: 2026-07-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-patient-program-experience/spec.md`

## Summary

Entregar a **API paciente** que substitui os mocks do SPA (lista autenticada, **detalhe público por `public_token`**, visualização, execução com retomada/séries/última carga, feedback e conclusão idempotente).

**Produto — link e acesso**:
- “Copiar o link do programa” (clínica) → `{app.url}/{clinicSlug}/paciente/programas/{publicToken}`
- Abrir deep link **sem login** → SPA em `/detalhe-programa?id={publicToken}` com detalhe visível
- **Ver programa não exige login**; listar/executar/feedback/concluir exigem JWT `patient` do dono

**Abordagem modular** (`architecture-paradigm-modular-monolith`):

| Capacidade | Módulo dono | Contrato |
|------------|-------------|----------|
| Prescrição + engajamento paciente (view/execução/feedback/conclusão) | **TreatmentProgram** | HTTP `/api/patient/programs/*` + models/tabelas próprias |
| Auth JWT paciente | **Patient** | existente (`auth:patient`); sem Models de plano |
| Mídia de exercício (URL/thumbnail) | Admin/Media (já usados no plano) | eager-load / dados já no exercício prescrito |

**Clean code** (`backend-clean-code`): Controller fino → FormRequest → DTO → **UseCase/Service por ação** → `RepositoryInterface` → Eloquent. Regras de status/disponibilidade e idempotência no Service; Policy/escopo por paciente autenticado. Frontend troca mock por repository + corrige guard `patient` no `apiClient`.

## Technical Context

**Language/Version**: PHP 8.2+ (Laravel 12); TypeScript strict + React 19

**Primary Dependencies**: Laravel 12, tymon/jwt-auth (guard `patient`), Eloquent; React 19, TanStack Query v5, react-router-dom v6, RHF+Zod (feedback), axios `apiClient`

**Storage**: MySQL/PostgreSQL — `clinic_treatment_plans` (+ outcome flags); novas tabelas de execução/série/feedback no módulo TreatmentProgram

**Testing**: PHPUnit 11 + Mockery (`RefreshDatabase`, `actingAs($patient, 'patient')`); Vitest 4 + RTL para mapper/hooks FE

**Target Platform**: SPA paciente + REST Laravel

**Project Type**: Web application (modular monolith + frontend DDD)

**Performance Goals**: Listagem/detalhe sem N+1 (eager-load groups.exercises.exercise.media); detalhe típico &lt; 1s em dev local

**Constraints**:
- Backend fonte de verdade (authZ, disponibilidade, validação de outcome flags, conclusão idempotente)
- TreatmentProgram **não** importa Repository/Model interno de Patient para regra nova — identidade via `auth('patient')->user()`; se precisar read de Patient além do JWT, usar `PatientServiceInterface`
- Patient **não** importa Models/Repositories de TreatmentProgram
- Tabela dona única: engajamento em tabelas do TreatmentProgram (prefixo alinhado a `clinic_treatment_*`)
- Sem painel clínica de feedback nesta feature
- Sem reexecução após conclusão (v1); feedback e complete em **duas etapas**
- Skills: `architecture-paradigm-modular-monolith`, `backend-clean-code`, `backend-module`, `laravel-eloquent`, `php-modern`, `php-testing`, `security`, `api-client`, `frontend-ddd`

**Scale/Scope**: ~8 endpoints patient; 1 migration em plans (flags) + 2–3 migrations engajamento; ~8 UseCases; FE: repository real + guard patient + hooks de execução

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` é template. Gate substituto = princípios do `CLAUDE.md` / skills de arquitetura:

| Princípio | Status | Observação |
|-----------|--------|------------|
| 1. Backend fonte de verdade | ✅ | Disponibilidade, flags de outcome, ownership e complete no backend |
| 2. Backend limpo | ✅ | UseCase por ação; Controller sem query; Repository sem regra |
| 3. Monólito modular | ✅ | TreatmentProgram dono dos dados/API; Patient só auth; sem Repository cruzado |
| 4. Camadas frontend | ✅ | `application/` hooks; `infrastructure/` repository; pages sem `apiClient` |
| 5. `apiClient` único | ✅ | Estender inferência de guard para `/patient/*` |
| 6. Domain puro | ✅ | Manter `domain/patient/program.ts`; mappers na infra |
| 7. Form 2+ campos → RHF+Zod | ✅ | Feedback já no FE; validação espelhada no FormRequest |

**Resultado do gate**: PASS (pós Phase 1 mantido). Decisões em [research.md](./research.md). ADR curto de fronteira no research.

## Project Structure

### Documentation (this feature)

```text
specs/015-patient-program-experience/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── patient-programs-rest.md
│   └── module-boundaries.md
├── checklists/requirements.md
└── tasks.md                 # /speckit-tasks
```

### Source Code (repository root)

```text
modules/TreatmentProgram/
├── routes/patient.php                                    # NOVO — prefix patient/programs; GET {token} PÚBLICO; resto auth:patient
├── app/Providers/…                                       # registrar rotas patient + binds
├── database/migrations/
│   ├── …_add_outcome_flags_to_clinic_treatment_plans.php # NOVO
│   ├── …_create_clinic_treatment_plan_executions_table.php
│   ├── …_create_clinic_treatment_plan_execution_series_table.php
│   └── …_create_clinic_treatment_plan_feedbacks_table.php
├── app/Models/
│   ├── TreatmentPlan.php                                 # ALTERAR (flags, relações executions/feedbacks)
│   ├── TreatmentPlanExecution.php                        # NOVO
│   ├── TreatmentPlanExecutionSeries.php                  # NOVO
│   └── TreatmentPlanFeedback.php                         # NOVO
├── app/Contracts/
│   ├── TreatmentPlanExecutionRepositoryInterface.php     # interno
│   ├── TreatmentPlanFeedbackRepositoryInterface.php      # interno
│   └── (reuso) patient program repository interfaces
├── app/Repositories/…                                    # Eloquent scoped clinic+patient+token
├── app/Services/PatientProgram/                          # UseCases (1 classe / ação)
│   ├── ListPatientProgramsService.php
│   ├── GetPatientProgramDetailService.php
│   ├── RegisterPatientProgramViewService.php
│   ├── StartOrResumePatientProgramExecutionService.php
│   ├── SavePatientProgramSeriesService.php
│   ├── UpdateUnfinishedExercisesService.php
│   ├── SubmitPatientProgramFeedbackService.php
│   └── CompletePatientProgramService.php
├── app/Support/PatientProgramStatusMapper.php            # deriva status FE
├── app/Http/Controllers/Patient/PatientProgramController.php
├── app/Http/Requests/Patient/…                           # series, unfinished, feedback
├── app/Http/Resources/Patient/…                          # opcional — ou arrays tipados via DTO→JSON
├── app/DTOs/PatientProgram/…                             # readonly DTOs
└── tests/Feature/Patient/…                               # isolamento + fluxo feliz + idempotência

modules/Patient/
└── (sem mudança de domínio de plano)                     # auth permanece

resources/js/
├── infrastructure/api/client.ts                          # ALTERAR — AuthGuard + infer `/patient/*`
├── infrastructure/repositories/api-patient-programs.ts   # NOVO — substitui mock
├── application/patient/use-patient-program.ts            # ALTERAR — Query/Mutation reais + execução
└── domain/patient/program.ts                             # ajustar só se contrato exigir
```

**Structure Decision**: Capacidade de **programa do paciente** fica no bounded context **TreatmentProgram** (dono da prescrição e do engajamento). Rotas HTTP patient no mesmo módulo (precedente Media: `routes/patient.php`). Patient permanece dono só da identidade/auth. FE DDD troca mock por repository HTTP.

## Complexity Tracking

Nenhuma violação de constituição a justificar.

## Phase 0 / Phase 1

- Phase 0: [research.md](./research.md) — ownership, status mapping, schema, clean-code layout
- Phase 1: [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)
- Agent context: bloco SPECKIT em `CLAUDE.md` aponta para este `plan.md`
