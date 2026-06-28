# Implementation Plan: Clinic Scheduling Extraction

**Branch**: `007-clinic-scheduling-extraction` | **Date**: 2026-06-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/007-clinic-scheduling-extraction/spec.md`

## Summary

Extrair a capacidade de **agendamento** (appointments) do módulo `Clinic` para um novo módulo físico `ClinicScheduling`, espelhando exatamente o precedente já consolidado de `ClinicFinance` (ADR-006). O `ClinicScheduling` passa a ser o único dono do código, rotas, migrations, factories, seeders, eventos e testes de agendamento. **Nenhum contrato HTTP muda** — mesmos paths `/api/clinic/appointments/*`, mesmos shapes de request/response — então o frontend não muda.

A abordagem técnica:

1. **Mover** todo o código de agendamento de `Clinic` → `ClinicScheduling`, ajustando namespaces.
2. **Manter a fronteira limpa** usando a convenção real do projeto: relações Eloquent cross-module por **FQN inline** (não `use`), Policies/FormRequests sem `use` de Models de outros módulos — o que mantém o `ModuleBoundaryTest` verde (ele só escaneia linhas `use Modules\...`).
3. **Inverter dependências via eventos (EDA)**: o `AppointmentService` deixa de chamar diretamente o Job do GoogleCalendar e o `ActivityLogger` do Clinic; passa a despachar 4 eventos de integração (`AppointmentScheduled`, `AppointmentRescheduled`, `AppointmentCancelled`, `AppointmentCompleted`) via `DB::afterCommit`. GoogleCalendar e ActivityLog viram **listeners** desses eventos.
4. **Expor read model público** (`SchedulingReadServiceInterface`) para os consumidores que permanecem em `Clinic` (Dashboard e OccupancyRate) lerem dados de agendamento sem importar o Model privado.
5. **Registrar o módulo** pelo mecanismo real (`module.json` + `modules_statuses.json`), **sem** tocar em `bootstrap/providers.php`.
6. **Fitness tests**: estender `ModuleBoundaryTest` para escanear `ClinicScheduling`; adicionar `SchedulingRouteCompatibilityTest`; estender `ExtractionReadinessTest` e as fixtures; flipar `scheduling` para `extracted` no capability map.

## Technical Context

**Language/Version**: PHP 8.2+ (sem `declare(strict_types=1)`, por convenção do projeto)

**Primary Dependencies**: Laravel 12, `nwidart/laravel-modules`, `tymon/jwt-auth` (guard `clinic`), Carbon/CarbonImmutable

**Storage**: MySQL/PostgreSQL via Eloquent. Tabela `clinic_appointments` (nome **inalterado**); migration movida para `modules/ClinicScheduling/database/migrations`

**Testing**: PHPUnit 11 + Mockery. Testes de módulo em `modules/ClinicScheduling/tests`; fitness tests em `tests/Architecture`

**Target Platform**: API REST backend (monólito modular), guard `clinic`

**Project Type**: Backend modular monolith (apenas backend; frontend fora de escopo)

**Performance Goals**: Paridade com o comportamento atual (refactor sem mudança de carga). Sem N+1 novos; manter eager loading `['patient','clinicUser']`

**Constraints**: Zero mudança de contrato REST (path/method/request/response). `is_null()`/`! is_null()` e `empty()`/`! empty()`. Provider via `modules_statuses`, nunca `bootstrap/providers.php`. ClinicScheduling não importa Model/Repository privado de outro módulo em produção

**Scale/Scope**: 1 nova capability extraída; ~1 tabela; 6 endpoints REST; 4 eventos; 1 read model público; 2 listeners (GoogleCalendar, ActivityLog); 2 consumidores adaptados (Dashboard, OccupancyRate)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

O arquivo `.specify/memory/constitution.md` está como template não preenchido (sem princípios ratificados). Os princípios efetivos do projeto vivem em `CLAUDE.md` + skills `.claude/skills/`. Avaliação contra esses princípios não-negociáveis:

| Princípio (CLAUDE.md / skills) | Status | Como o plano atende |
|--------------------------------|--------|---------------------|
| Backend é fonte de verdade | ✅ PASS | Autorização permanece em Policy + guard; nada migra para o frontend |
| Backend limpo (Controller não pensa; Service decide; Repository busca/salva; Interface desacopla) | ✅ PASS | Camadas preservadas; Controller depende de `AppointmentServiceInterface`; queries no Repository |
| Monólito modular (módulos não importam internals de outros para regra) | ✅ PASS | FQN inline para relações; eventos + read model público para cross-module; fitness test estendido |
| Eventos carregam IDs + snapshot mínimo, nunca Model | ✅ PASS | 4 eventos `final readonly` com primitivos + `CarbonImmutable` |
| Registro via `modules_statuses` (não `bootstrap/providers.php`) | ✅ PASS | `module.json` + flag em `modules_statuses.json` |
| Convenções PHP (`is_null`/`empty`, sem strict_types) | ✅ PASS | Mantidas no código movido/novo |

**Resultado do Gate**: PASS. Sem violações que exijam justificativa em Complexity Tracking.

## Bounded Context & Ownership

**Bounded context**: *Clinic Scheduling* — o ciclo de vida da consulta agendada (agendar, confirmar, reagendar, concluir, cancelar, no-show), incluindo regras de transição de status, visibilidade por papel e isolamento multi-tenant.

**Ownership de tabelas:**

| Tabela | Dono antes | Dono depois | Observação |
|--------|-----------|-------------|------------|
| `clinic_appointments` | Clinic | **ClinicScheduling** | Nome inalterado; migration movida |
| `clinics`, `clinic_users` | Clinic | Clinic | Referenciadas por FQN inline (FK preservadas) |
| `patients` | Patient | Patient | Referenciada por FQN inline (FK preservada) |
| `clinic_activities` | Clinic | Clinic | Escrita via listener do Clinic, reagindo a eventos |

**Regra de dependência (quem chama quem):**

- `ClinicScheduling` → ninguém (produção limpa; só referencia `clinics`/`clinic_users`/`patients` por FK + FQN inline em relações).
- `Clinic` (Dashboard, Occupancy) → `ClinicScheduling` via `SchedulingReadServiceInterface` (contrato público).
- `Clinic` (ActivityLog) → escuta eventos de `ClinicScheduling` (listener).
- `GoogleCalendar` → escuta eventos de `ClinicScheduling` (listener) e ainda usa o Model `Appointment` de `ClinicScheduling` para push/pull (débito documentado; GoogleCalendar não é escaneado pelo boundary test).

## Project Structure

### Documentation (this feature)

```text
specs/007-clinic-scheduling-extraction/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 — decisões de design
├── data-model.md        # Phase 1 — entidades, eventos, read model
├── quickstart.md        # Phase 1 — guia de validação
├── contracts/           # Phase 1
│   ├── rest-appointments.md
│   ├── internal-contracts.md
│   ├── public-contracts.md
│   └── integration-events.md
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks) — NÃO criado aqui
```

### Source Code (repository root)

Módulo novo (espelha `modules/ClinicFinance`):

```text
modules/ClinicScheduling/
├── app/
│   ├── Contracts/
│   │   ├── AppointmentRepositoryInterface.php          # interno
│   │   ├── AppointmentServiceInterface.php             # interno
│   │   └── Public/SchedulingReadServiceInterface.php   # PÚBLICO (Dashboard/Occupancy)
│   ├── Enums/AppointmentStatus.php
│   ├── Events/{AppointmentScheduled,AppointmentRescheduled,AppointmentCancelled,AppointmentCompleted}.php
│   ├── Http/
│   │   ├── Controllers/AppointmentController.php
│   │   └── Requests/{Store,Update,UpdateStatus}AppointmentRequest.php
│   ├── Jobs/AppointmentScheduledNotificationJob.php    # movido de Clinic
│   ├── Models/Appointment.php
│   ├── Policies/AppointmentPolicy.php
│   ├── Providers/{ClinicSchedulingServiceProvider,EventServiceProvider,RouteServiceProvider}.php
│   ├── Repositories/AppointmentRepository.php
│   └── Services/{AppointmentService,SchedulingReadService}.php
├── config/config.php
├── database/
│   ├── factories/AppointmentFactory.php
│   ├── migrations/2026_06_16_000001_create_clinic_appointments_table.php
│   └── seeders/ (ver research — provavelmente N/A)
├── routes/clinic.php                                   # prefixo appointments preservado
├── tests/{Feature,Unit}/                               # movidos + SchedulingRouteCompatibilityTest
├── composer.json
└── module.json
```

Mudanças em módulos existentes (adaptação de consumidores):

```text
modules/Clinic/
├── routes/clinic.php                          # REMOVER grupo appointments + imports
├── app/Repositories/DashboardRepository.php   # ler via SchedulingReadServiceInterface
├── app/Services/OccupancyRateService.php      # ler via SchedulingReadServiceInterface
├── app/Providers/ClinicServiceProvider.php    # REMOVER bindings/policy de Appointment
├── app/Listeners/RecordSchedulingActivity.php # NOVO listener (ActivityLog ← eventos)
└── (remover todo o código de agendamento listado acima)

modules/GoogleCalendar/
├── app/Listeners/SyncSchedulingToGoogle.php   # NOVO listener (push/delete ← eventos)
└── app/{Jobs,Services,Contracts}/*            # re-apontar imports Clinic → ClinicScheduling

tests/Architecture/
├── ModuleBoundaryTest.php                      # escanear também ClinicScheduling
├── ExtractionReadinessTest.php                 # + asserts de scheduling
├── fixtures/clinic-capability-map.php          # scheduling: candidate → extracted
└── fixtures/extraction-readiness.php           # + ClinicScheduling

docs/
├── adr/008-clinic-scheduling-extraction.md     # NOVO
├── architecture/clinic-capability-map.md       # atualizar
└── architecture/extraction-readiness-checklist.md # + seção ClinicScheduling
```

**Structure Decision**: Monólito modular existente. `ClinicScheduling` é criado espelhando `modules/ClinicFinance` (mesmos providers, `module.json`, layout `app/` PSR-4). A capability `scheduling` já está pré-registrada como `candidate` no `clinic-capability-map.php`; o plano a promove a `extracted`.

## Phase 0 — Research

Ver [research.md](research.md). Decisões-chave resolvidas: convenção de FQN inline para relações cross-module; inversão de dependência via eventos para GoogleCalendar/ActivityLog; read model público para Dashboard/Occupancy; trigger de `AppointmentRescheduled` em qualquer update (clarificação); estratégia de seeder; estratégia de migrate:fresh.

## Phase 1 — Design & Contracts

- [data-model.md](data-model.md) — entidade Appointment, enum AppointmentStatus, eventos, read DTOs.
- [contracts/](contracts/) — REST preservado, contratos internos, contrato público, eventos.
- [quickstart.md](quickstart.md) — guia de validação (pint, fitness tests, route:list, migrate:fresh).
- Agent context: atualizar marcador SPECKIT no `CLAUDE.md` apontando para este plano.

## Complexity Tracking

> Sem violações de Constitution Check. Nenhuma justificativa necessária.

A única complexidade acima de "mover arquivos" é a **inversão de dependências cross-module** (GoogleCalendar/ActivityLog viram listeners; Dashboard/Occupancy leem via read model público). Isso é **exigido** pelos princípios de fronteira (FR-013/018/019/020) e pela meta de EDA/readiness — não é complexidade acidental. A alternativa (ClinicScheduling chamando Jobs/Contracts privados de outros módulos, ou Clinic importando o Model privado de ClinicScheduling) foi rejeitada por violar a regra de fronteira e a prontidão para extração.
