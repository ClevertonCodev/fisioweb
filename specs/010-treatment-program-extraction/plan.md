# Implementation Plan: Treatment Program Extraction

**Branch**: `010-treatment-program-extraction` | **Date**: 2026-07-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/010-treatment-program-extraction/spec.md`

## Summary

Extrair a capacidade de **prescrição de exercícios** (planos de tratamento com grupos e exercícios prescritos, rascunhos de montagem de programa, e navegação no catálogo de programas do admin) do módulo `Clinic` para um novo módulo físico `TreatmentProgram`, espelhando os precedentes de `ClinicScheduling` (ADR-008) e `ClinicalRecord` (ADR-009). O `TreatmentProgram` passa a ser o único dono do código, rotas, migrations, factories, seeders, policies, eventos e testes da prescrição. **Nenhum contrato HTTP muda** — mesmos paths, request/response shapes — o frontend não muda, incluindo o widget `active_programs` e o feed de atividades do dashboard.

A abordagem técnica:

1. **Criar módulo** `modules/TreatmentProgram` (layout espelhando `ClinicScheduling`: `module.json` com 1 provider + 3 providers reais, `config/config.php`, `routes/clinic.php` merge).
2. **Mover** todo código de prescrição de `Clinic` → `TreatmentProgram`, ajustando namespaces (Models, Controllers, Requests, Service, Repository, Contracts, Policy, Seeder, Factory, Tests, Migrations via `git mv`).
3. **Corrigir 2 acoplamentos de regra de negócio** hoje no Clinic, sem mudar comportamento:
   - `TreatmentPlanService` deixa de importar `Modules\Admin\Models\Exercise`; passa a usar **novo contrato público Admin** `ExerciseCatalogReadServiceInterface` (defaults de prescrição por `exercise_id`).
   - `SharedProgramController` (`clinic.programs.*`) deixa de ler `Modules\Admin\Models\AdminProgram`; passa a usar **novo contrato público Admin** `ProgramCatalogReadServiceInterface`, preservando paginação e shapes.
4. **Fronteira cross-module nos Models**: relações Eloquent por FQN inline (ADR-008) para `Clinic`, `ClinicUser`, `Patient`, `PhysioArea`, `PhysioSubarea`, `Exercise` — permitido só em Models para eager load/serialização JSON, proibido em Services.
5. **Eventos de integração (EDA)**: 7 eventos `final readonly` despachados via `DB::afterCommit` nos Services de escrita.
6. **WhatsApp de ativação**: remover `TreatmentPlanObserver` (dispatch direto de `SendWhatsAppMessageJob`); mover para um **listener** `SendTreatmentPlanActivationNotification` que reage a `TreatmentPlanActivated`, obtendo telefone via `PatientServiceInterface` e mantendo condições/mensagem atuais.
7. **Dashboard**: `Clinic.DashboardRepository::activeProgramsCount` deixa de consultar `clinic_treatment_plans`; passa a consumir **novo contrato público** `TreatmentProgramReadServiceInterface::activeProgramsCount(...)` (espelha `SchedulingReadServiceInterface`, já consumido pelo dashboard).
8. **Activity log**: `TreatmentProgram` continua registrando `ProgramCreated`/`ProgramCompleted`/`ExercisesAdded` via `Modules\Clinic\Contracts\ActivityLoggerInterface` (contrato compartilhado, precedente: `Patient`), preservando o feed de atividades do dashboard byte-a-byte. Coupling documentado em ADR-010 com plano de remoção.
9. **Registrar módulo** via `module.json` + `modules_statuses.json` (`"TreatmentProgram": true`); nunca `bootstrap/providers.php`.
10. **Fitness tests**: estender `ModuleBoundaryTest`, `ExtractionReadinessTest`, fixtures; criar `TreatmentProgramRouteCompatibilityTest`.
11. **Documentação**: ADR-010, capability map, extraction-readiness checklist.

## Technical Context

**Language/Version**: PHP 8.2+ (sem `declare(strict_types=1)`, por convenção do projeto)

**Primary Dependencies**: Laravel 12, `nwidart/laravel-modules`, JWT guard `clinic`, Carbon/CarbonImmutable, `barryvdh/laravel-dompdf` (via `Modules\Pdf`)

**Storage**: MySQL/PostgreSQL via Eloquent. **5 migrations** de prescrição (4 create + 1 alter `add_patient_engagement_to_clinic_treatment_plans`); nomes de tabela **inalterados**; migrations movidas para `modules/TreatmentProgram/database/migrations`. Sem SoftDeletes (delete é hard delete — comportamento atual)

**Testing**: PHPUnit 11 + Mockery. Testes em `modules/TreatmentProgram/tests` (25 métodos existentes migrados); fitness tests em `tests/Architecture`

**Target Platform**: API REST backend (monólito modular), guard `clinic`

**Project Type**: Backend modular monolith (frontend fora de escopo)

**Performance Goals**: Paridade com comportamento atual; manter eager loading existente (`groups.exercises.exercise.videos`, `exercises.exercise.videos`, `patient`, `physioArea`, `physioSubarea`)

**Constraints**: Zero mudança de contrato REST. `is_null()`/`! is_null()`, `empty()`/`! empty()`. Controller → `ServiceInterface`; Service → `RepositoryInterface`. Eventos afterCommit, sem Model Eloquent. Blade de PDF (`pdf.clinic.treatment.treatment-plan`) permanece em `resources/views` app-level (não movido). Módulo `WhatsApp` está `false` em `modules_statuses` mas o job autoloada (comportamento atual preservado)

**Scale/Scope**: 1 capability extraída; 4 tabelas; ~13 endpoints REST (treatment-plans 8, program-drafts 3, programs 2); 7 eventos; 3 contratos públicos novos (2 no Admin, 1 no TreatmentProgram); 1 listener WhatsApp (substitui observer); refactor de `ProgramDraftController` para Service+Repository

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` está como template não ratificado. Princípios efetivos em `CLAUDE.md` + skills (`architecture-paradigm-modular-monolith`, `backend-clean-code`).

| Princípio | Status | Como o plano atende |
|-----------|--------|---------------------|
| Backend é fonte de verdade | ✅ PASS | Policies + guard `clinic` preservados; ownership por `clinic_id` |
| Backend limpo (Controller/Service/Repository/Interface) | ✅ PASS | `ProgramDraftController` ganha Service+Repository; controllers dependem de interfaces |
| Monólito modular | ✅ PASS | FQN inline em Models (ADR-008); contratos públicos Admin/Patient/Pdf; fitness tests |
| Eventos com snapshot mínimo | ✅ PASS | 7 eventos `final readonly` afterCommit |
| Registro via `modules_statuses` | ✅ PASS | `module.json` + flag; sem `bootstrap/providers.php` |
| Convenções PHP | ✅ PASS | `is_null`/`empty` mantidos |

**Resultado do Gate**: PASS. Uma dependência temporária aceita (`ActivityLoggerInterface`) documentada em Complexity Tracking + ADR-010; não é violação (é ServiceInterface, com precedente `Patient`).

## Bounded Context & Ownership

**Bounded context**: *Treatment Program* — prescrição de exercícios da clínica: planos de tratamento (com grupos e exercícios prescritos, baseados no catálogo admin), rascunhos de montagem de programa por usuário, e ciclo de vida do plano (rascunho → ativo → concluído → cancelado/arquivado).

**Ownership de tabelas:**

| Tabela | Dono antes | Dono depois | Observação |
|--------|-----------|-------------|------------|
| `clinic_treatment_plans` | Clinic | **TreatmentProgram** | hard delete; status draft/active/completed/cancelled; `patient_viewed_at`, `patient_completed_count` |
| `clinic_treatment_plan_groups` | Clinic | **TreatmentProgram** | cascade from plan |
| `clinic_treatment_plan_exercises` | Clinic | **TreatmentProgram** | FK `exercise_id` → admin_exercises |
| `clinic_program_drafts` | Clinic | **TreatmentProgram** | 1 por `clinic_user_id` |
| `admin_exercises`, `admin_programs`, `admin_physio_areas/subareas` | Admin | Admin | consumido via contrato público / FQN inline em Model |
| `patients` | Patient | Patient | FQN inline em Model + `PatientServiceInterface` |
| `clinic_users`, `clinics` | Clinic | Clinic | FQN inline em Models |

**Regra de dependência:**

- `TreatmentProgram` → `Admin` via `ExerciseCatalogReadServiceInterface` (defaults de prescrição) e `ProgramCatalogReadServiceInterface` (endpoints `programs`).
- `TreatmentProgram` → `Patient` via `PatientServiceInterface` (telefone/clinic no listener WhatsApp; validação já é por `exists:patients,id` no Request).
- `TreatmentProgram` → `Pdf` via `PdfService`/contrato público (download PDF do plano).
- `TreatmentProgram` → `WhatsApp` via `SendWhatsAppMessageJob` (dispatch de job público, no listener).
- `TreatmentProgram` → `Clinic` via `ActivityLoggerInterface` (contrato compartilhado — acoplamento aceito, ADR-010).
- `Clinic` (dashboard) → `TreatmentProgram` via `TreatmentProgramReadServiceInterface` (contagem de programas ativos).
- Nenhum módulo importa Models/Repositories privados de `TreatmentProgram`.

## Project Structure

### Documentation (this feature)

```text
specs/010-treatment-program-extraction/
├── plan.md              # Este arquivo
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── rest-treatment-program.md
│   ├── internal-contracts.md
│   ├── public-contracts.md
│   └── integration-events.md
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
modules/TreatmentProgram/
├── app/
│   ├── Contracts/
│   │   ├── TreatmentPlanRepositoryInterface.php      # git mv de Clinic
│   │   ├── TreatmentPlanServiceInterface.php         # git mv de Clinic
│   │   ├── ProgramDraftRepositoryInterface.php       # NOVO
│   │   ├── ProgramDraftServiceInterface.php          # NOVO
│   │   └── Public/
│   │       └── TreatmentProgramReadServiceInterface.php  # NOVO (dashboard)
│   ├── Events/
│   │   ├── TreatmentPlanCreated.php
│   │   ├── TreatmentPlanActivated.php
│   │   ├── TreatmentPlanCompleted.php
│   │   ├── TreatmentPlanArchived.php
│   │   ├── ProgramDraftCreated.php
│   │   ├── ProgramDraftUpdated.php
│   │   └── ProgramDraftConvertedToTreatmentPlan.php
│   ├── Listeners/
│   │   └── SendTreatmentPlanActivationNotification.php  # substitui Observer
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── TreatmentPlanController.php           # git mv
│   │   │   ├── ProgramDraftController.php            # git mv + refactor p/ Service
│   │   │   └── SharedProgramController.php           # git mv + contrato Admin
│   │   └── Requests/
│   │       ├── StoreTreatmentPlanRequest.php         # git mv
│   │       └── UpdateTreatmentPlanRequest.php        # git mv
│   ├── Models/
│   │   ├── TreatmentPlan.php                         # git mv + FQN inline
│   │   ├── TreatmentPlanGroup.php                    # git mv
│   │   ├── TreatmentPlanExercise.php                 # git mv + FQN inline
│   │   └── ClinicProgramDraft.php                    # git mv + FQN inline
│   ├── Policies/
│   │   └── TreatmentPlanPolicy.php                   # git mv
│   ├── Providers/
│   │   ├── TreatmentProgramServiceProvider.php       # NOVO
│   │   ├── EventServiceProvider.php                  # NOVO
│   │   └── RouteServiceProvider.php                  # NOVO
│   ├── Repositories/
│   │   ├── TreatmentPlanRepository.php               # git mv
│   │   ├── ProgramDraftRepository.php                # NOVO
│   │   └── TreatmentProgramReadService.php           # NOVO (impl. read público)
│   └── Services/
│       ├── TreatmentPlanService.php                  # git mv + eventos + contrato Admin
│       └── ProgramDraftService.php                   # NOVO
├── config/config.php
├── database/
│   ├── factories/                                    # git mv (se existir) / NOVO
│   ├── migrations/ (5 arquivos git mv de Clinic)
│   └── seeders/TreatmentPlanSeeder.php               # git mv
├── routes/clinic.php                                 # subset de rotas de prescrição
├── tests/{Feature,Unit}/                             # git mv (25 métodos)
├── composer.json
└── module.json

modules/Admin/
├── app/Contracts/Public/ExerciseCatalogReadServiceInterface.php   # NOVO
├── app/Contracts/Public/ProgramCatalogReadServiceInterface.php    # NOVO
├── app/Services/ExerciseCatalogReadService.php                    # NOVO
└── app/Services/ProgramCatalogReadService.php                     # NOVO

modules/Clinic/  (remover prescrição)
├── routes/clinic.php                        # REMOVER rotas treatment-plans/program-drafts/programs
├── app/Providers/ClinicServiceProvider.php  # REMOVER bindings/observer/policy de TreatmentPlan
├── app/Repositories/DashboardRepository.php # activeProgramsCount → TreatmentProgramReadServiceInterface
└── database/seeders/                         # re-apontar imports p/ TreatmentProgram, se houver

tests/Architecture/                          # estender fitness tests + fixtures
docs/
├── adr/010-treatment-program-extraction.md
├── architecture/clinic-capability-map.md
└── architecture/extraction-readiness-checklist.md
```

**Structure Decision**: Monólito modular existente. `TreatmentProgram` espelha `ClinicScheduling`/`ClinicalRecord`. Capability `treatment_program` promovida a `extracted` no capability map.

## Phase 0 — Research

Ver [research.md](research.md). Decisões-chave: registro via `modules_statuses`; FQN inline (ADR-008); 2 contratos públicos Admin (exercícios/programas) para remover imports de Model em regra de negócio; contrato público de leitura para o dashboard; WhatsApp via listener de `TreatmentPlanActivated`; ActivityLogger mantido via contrato compartilhado (coupling aceito); mapeamento de eventos para transições de status (`active`/`completed`/`cancelled`); `ProgramDraftConvertedToTreatmentPlan` best-effort no `create` quando há rascunho do ator; refactor de `ProgramDraftController`; PDF blade app-level preservado; fitness tests.

## Phase 1 — Design & Contracts

- [data-model.md](data-model.md) — 4 entidades, status/transições, 7 eventos, read model.
- [contracts/](contracts/) — REST preservado, contratos internos, 3 contratos públicos, eventos.
- [quickstart.md](quickstart.md) — validação (pint, fitness, route:list, migrate:fresh --seed).
- Agent context: atualizar bloco SPECKIT em `CLAUDE.md` e `AGENTS.md` para apontar este plano.

## Complexity Tracking

> Constitution Check: PASS. Um acoplamento temporário aceito, registrado abaixo e em ADR-010.

| Complexidade acima de "mover arquivos" | Por que necessário | Alternativa rejeitada |
|----------------------------------------|--------------------|-----------------------|
| 2 contratos públicos novos no Admin (exercícios + programas) | Remover imports de `Admin\Models\Exercise`/`AdminProgram` de regra de negócio (FR-014/015) | Manter imports diretos — viola fronteira e fitness tests |
| Contrato público de leitura no TreatmentProgram (dashboard) | Dashboard do Clinic não pode consultar `clinic_treatment_plans` após extração (FR-020) | Query direta cross-module no Clinic — quebra ownership |
| Introdução de `ProgramDraftService`+`ProgramDraftRepository` | `ProgramDraftController` fazia query no controller (FR-010) | Manter controller gordo — viola backend limpo |
| WhatsApp via listener (não observer) | Desacoplar side-effect e ligá-lo ao evento de domínio (FR-019) | Manter observer — mantém side-effect fora do fluxo EDA |
| **Acoplamento aceito**: `TreatmentProgram` → `Clinic\Contracts\ActivityLoggerInterface` | Preservar o feed de atividades do dashboard byte-a-byte (ProgramCreated/Completed/ExercisesAdded) com risco mínimo; é ServiceInterface (não Model), precedente `Patient` | Mover logging para listener no Clinic exigiria um evento extra "exercises-updated" e arriscaria a granularidade do feed — adiado (plano de remoção no ADR-010) |
