# Implementation Plan: Clinical Record Extraction

**Branch**: `008-clinical-record-extraction` | **Date**: 2026-06-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/008-clinical-record-extraction/spec.md`

## Summary

Extrair a capacidade de **prontuário digital** (avaliações, evoluções, arquivos do paciente, templates de evolução e leitura de catálogo de templates de avaliação) do módulo `Clinic` para um novo módulo físico `ClinicalRecord`, espelhando os precedentes de `ClinicFinance` (ADR-006) e `ClinicScheduling` (ADR-008). O `ClinicalRecord` passa a ser o único dono do código, rotas, migrations, factories, seeders, policies, eventos e testes do prontuário. **Nenhum contrato HTTP muda** — mesmos paths, request/response shapes — o frontend não muda.

A abordagem técnica:

1. **Criar módulo** `modules/ClinicalRecord` (layout espelhando `ClinicScheduling` / `ClinicFinance`).
2. **Mover** todo código de prontuário de `Clinic` → `ClinicalRecord`, ajustando namespaces.
3. **Introduzir camada Repository** onde hoje Services fazem query direta (`AssessmentService`, `EvolutionService`, `EvolutionTemplateService`, `PatientFileService`).
4. **Fronteira cross-module**: relações Eloquent por FQN inline nos Models (ADR-008); Services usam `PatientServiceInterface`, `FileServiceInterface`, `PdfGeneratorInterface`; validação de template Admin via **novo contrato público** `AssessmentTemplateReadServiceInterface` implementado no módulo `Admin`.
5. **Eventos de integração (EDA)**: 6 eventos `final readonly` despachados via `DB::afterCommit` nos Services de escrita.
6. **Registrar módulo** via `module.json` + `modules_statuses.json` (nunca `bootstrap/providers.php`).
7. **Fitness tests**: estender `ModuleBoundaryTest`, `ExtractionReadinessTest`, fixtures; criar `ClinicalRecordRouteCompatibilityTest`.
8. **Documentação**: ADR-009, capability map, extraction-readiness checklist.

## Technical Context

**Language/Version**: PHP 8.2+ (sem `declare(strict_types=1)`, por convenção do projeto)

**Primary Dependencies**: Laravel 12, `nwidart/laravel-modules`, JWT guard `clinic`, Carbon/CarbonImmutable

**Storage**: MySQL/PostgreSQL via Eloquent. **10 migrations** de prontuário (9 create + 1 alter `add_name_to_clinic_patient_files`); nomes de tabela **inalterados**; migrations movidas para `modules/ClinicalRecord/database/migrations`

**Testing**: PHPUnit 11 + Mockery. Testes em `modules/ClinicalRecord/tests`; fitness tests em `tests/Architecture`

**Target Platform**: API REST backend (monólito modular), guard `clinic`

**Project Type**: Backend modular monolith (frontend fora de escopo)

**Performance Goals**: Paridade com comportamento atual; manter eager loading existente (`patient`, `clinicUser`, `template`, etc.)

**Constraints**: Zero mudança de contrato REST. `is_null()`/`! is_null()`, `empty()`/`! empty()`. Controller → `ServiceInterface`; Service → `RepositoryInterface`. Eventos afterCommit, sem Model Eloquent. `generate-text` permanece read-only (sem evento). Delete de `PatientFile` permanece soft-delete DB-only (sem remoção R2 — comportamento atual).

**Scale/Scope**: 1 capability extraída; 9 tabelas; ~20 endpoints REST; 6 eventos; 1 contrato público novo no Admin; 4 domínios (Assessment, Evolution, EvolutionTemplate, PatientFile); refactor para Repository em 4 services

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` está como template não ratificado. Princípios efetivos em `CLAUDE.md` + skills.

| Princípio | Status | Como o plano atende |
|-----------|--------|---------------------|
| Backend é fonte de verdade | ✅ PASS | Policies + guard preservados |
| Backend limpo (Controller/Service/Repository/Interface) | ✅ PASS | Repositories criados na extração; controllers dependem de interfaces |
| Monólito modular | ✅ PASS | FQN inline em Models; contratos públicos Admin/Patient/Cloudflare/Pdf; fitness tests |
| Eventos com snapshot mínimo | ✅ PASS | 6 eventos `final readonly` |
| Registro via `modules_statuses` | ✅ PASS | `module.json` + flag |
| Convenções PHP | ✅ PASS | Mantidas |

**Resultado do Gate**: PASS. Sem violações que exijam Complexity Tracking.

## Bounded Context & Ownership

**Bounded context**: *Clinical Record* — prontuário digital da clínica: avaliações estruturadas (baseadas em template admin), evoluções clínicas (com templates locais), anexos de arquivo do paciente e templates de evolução configuráveis.

**Ownership de tabelas:**

| Tabela | Dono antes | Dono depois | Observação |
|--------|-----------|-------------|------------|
| `clinic_assessments` | Clinic | **ClinicalRecord** | soft deletes |
| `clinic_assessment_answers` | Clinic | **ClinicalRecord** | cascade from assessment |
| `clinic_assessment_answer_options` | Clinic | **ClinicalRecord** | cascade from assessment |
| `clinic_evolution_templates` | Clinic | **ClinicalRecord** | incl. `is_system` seed |
| `clinic_evolution_template_sections` | Clinic | **ClinicalRecord** | |
| `clinic_evolution_template_items` | Clinic | **ClinicalRecord** | |
| `clinic_patient_evolutions` | Clinic | **ClinicalRecord** | soft deletes |
| `clinic_patient_evolution_checked_items` | Clinic | **ClinicalRecord** | |
| `clinic_patient_files` | Clinic | **ClinicalRecord** | soft deletes; coluna `name` |
| `admin_assessment_templates` (+ campos) | Admin | Admin | consumido via contrato público |
| `patients` | Patient | Patient | FK + `PatientServiceInterface` |
| `clinic_users`, `clinics` | Clinic | Clinic | FK + FQN inline em Models |

**Regra de dependência:**

- `ClinicalRecord` → `Patient` via `PatientServiceInterface` (validação de paciente/clínica).
- `ClinicalRecord` → `Admin` via `AssessmentTemplateReadServiceInterface` (catálogo + validação de payload).
- `ClinicalRecord` → `Cloudflare` via `FileServiceInterface` (upload; delete R2 **fora de escopo** — preservar DB-only).
- `ClinicalRecord` → `Pdf` via `PdfGeneratorInterface` (download PDF de evolução).
- Nenhum módulo externo importa Models/Repositories privados de `ClinicalRecord` hoje (sem read model público obrigatório nesta extração).

## Project Structure

### Documentation (this feature)

```text
specs/008-clinical-record-extraction/
├── plan.md              # Este arquivo
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── rest-clinical-record.md
│   ├── internal-contracts.md
│   ├── public-contracts.md
│   └── integration-events.md
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
modules/ClinicalRecord/
├── app/
│   ├── Contracts/
│   │   ├── AssessmentRepositoryInterface.php
│   │   ├── AssessmentServiceInterface.php
│   │   ├── EvolutionRepositoryInterface.php
│   │   ├── EvolutionServiceInterface.php
│   │   ├── EvolutionTemplateRepositoryInterface.php
│   │   ├── EvolutionTemplateServiceInterface.php
│   │   ├── PatientFileRepositoryInterface.php
│   │   └── PatientFileServiceInterface.php
│   ├── Events/
│   │   ├── AssessmentCreated.php
│   │   ├── AssessmentUpdated.php
│   │   ├── AssessmentCompleted.php
│   │   ├── EvolutionRecorded.php
│   │   ├── PatientFileAttached.php
│   │   └── PatientFileDeleted.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AssessmentController.php
│   │   │   ├── EvolutionController.php
│   │   │   ├── EvolutionTemplateController.php
│   │   │   ├── PatientFileController.php
│   │   │   └── SharedAssessmentTemplateController.php
│   │   └── Requests/ (Store/Update* movidos + existentes)
│   ├── Models/ (9 models)
│   ├── Policies/ (4 policies)
│   ├── Providers/
│   │   ├── ClinicalRecordServiceProvider.php
│   │   ├── EventServiceProvider.php
│   │   └── RouteServiceProvider.php
│   ├── Repositories/ (4 repositories — NOVOS na extração)
│   └── Services/ (4 services — refatorados com eventos + repos)
├── config/config.php
├── database/
│   ├── factories/PatientFileFactory.php (+ novas se necessário)
│   ├── migrations/ (10 arquivos git mv de Clinic)
│   └── seeders/
│       ├── EvolutionTemplateSeeder.php      # git mv
│       └── ClinicalRecordDatabaseSeeder.php   # opcional wrapper
├── routes/clinic.php
├── tests/{Feature,Unit}/
├── composer.json
└── module.json

modules/Admin/
├── app/Contracts/Public/AssessmentTemplateReadServiceInterface.php  # NOVO
└── app/Services/AssessmentTemplateReadService.php                   # NOVO

modules/Clinic/  (remover prontuário; ajustar seeders)
├── routes/clinic.php                    # REMOVER rotas/controllers de prontuário
├── app/Providers/ClinicServiceProvider.php  # REMOVER bindings/policies de prontuário
└── database/seeders/
    ├── ClinicPatientDataSeeder.php      # re-apontar imports → ClinicalRecord
    └── ClinicDatabaseSeeder.php         # chamar EvolutionTemplateSeeder do novo módulo

tests/Architecture/                    # estender fitness tests
docs/
├── adr/009-clinical-record-extraction.md
├── architecture/clinic-capability-map.md
└── architecture/extraction-readiness-checklist.md
```

**Structure Decision**: Monólito modular existente. `ClinicalRecord` espelha `ClinicScheduling`. Capability `clinical_record` promovida a `extracted` no capability map (substitui parcialmente o candidato genérico `care` para evolutions/clinical_files/assessments).

## Phase 0 — Research

Ver [research.md](research.md). Decisões-chave: registro do módulo; FQN inline (ADR-008); contrato Admin; refactor para Repository; eventos; rotas nested em `patients/` registradas pelo ClinicalRecord; seeders; Pdf via interface; PatientFile delete DB-only; fitness tests.

## Phase 1 — Design & Contracts

- [data-model.md](data-model.md) — 9 entidades, status, eventos.
- [contracts/](contracts/) — REST preservado, contratos internos, contrato público Admin, eventos.
- [quickstart.md](quickstart.md) — validação (pint, fitness, route:list, migrate:fresh).
- Agent context: atualizar SPECKIT em `CLAUDE.md` / `AGENTS.md`.

## Complexity Tracking

> Sem violações de Constitution Check.

Complexidade acima de "mover arquivos":

1. **Criação de contrato público Admin** — necessário pela clarificação (sem import de Models Admin em Services).
2. **Introdução de Repositories** — código legado não tinha; exigido por FR-010–012.
3. **Rotas nested sob `patients/`** — ClinicalRecord registra subset de rotas sob prefixo compartilhado com Clinic (padrão Laravel: merge de route files).

Alternativa rejeitada: manter imports diretos de `AdminAssessmentTemplate` no Service — viola clarificação e FR-013/021.
