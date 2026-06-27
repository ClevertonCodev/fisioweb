# Implementation Plan: Modular Monolith EDA

**Branch**: `main` | **Date**: 2026-06-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-modular-monolith-eda/spec.md`

## Summary

Evolve the backend into a stronger modular monolith with Event-Driven Architecture while keeping a single Laravel deploy. The first physical extraction is `ClinicFinance`, using clinic-scoped module naming, stable existing REST routes, stable existing table/view names, temporary documented shared writes only during migration, internal Laravel events with versionable payloads, and dependency fitness tests that fail prohibited production-code imports.

## Technical Context

**Language/Version**: PHP 8.2+, Laravel 12

**Primary Dependencies**: Laravel modules under `modules/`, Eloquent, Laravel Events/Listeners, Laravel Queues, JWT guards `admin` and `clinic`, barryvdh/laravel-dompdf for current PDF exports, Cloudflare R2 integrations where relevant

**Storage**: MySQL/PostgreSQL through Eloquent; existing clinic finance tables/views remain named as-is, including `clinic_financial_categories`, `clinic_financial_category_overrides`, `clinic_financial_opening_balances`, and `clinic_financial_transactions`

**Testing**: PHPUnit 11, Mockery 1.6, Laravel HTTP/Feature tests, architecture/fitness tests implemented as PHPUnit tests scanning backend module dependencies

**Target Platform**: Laravel backend API running as a single deployable application

**Project Type**: Backend REST API modular monolith; frontend is explicitly out of scope

**Performance Goals**: Preserve current clinic finance workflow behavior and avoid adding synchronous cross-module calls to side-effect flows; event listeners that perform I/O should be queue-capable and idempotent

**Constraints**: Existing public REST route paths, request contracts, response contracts, and frontend-visible flows must remain stable; no frontend changes; no table/view renames for existing clinic finance data; microservice extraction is a future option, not part of this implementation

**Scale/Scope**: Backend module architecture migration focused first on `ClinicFinance`, then patterns reusable for later clinic-scoped modules such as `ClinicScheduling`, `ClinicCare`, and `ClinicIdentity`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The repository constitution file still contains template placeholders, so no project-specific constitution gates can be enforced from that file. This plan therefore applies the repository AGENTS.md rules and the `architecture-paradigm-modular-monolith` skill as the effective governance source:

- Backend modules own their data, models, services, policies, routes, and events.
- Cross-module collaboration must use public application service interfaces, DTOs, events, endpoints, or read projections.
- Events carry identifiers and minimal snapshots, never Eloquent models.
- Route compatibility is mandatory for existing frontend flows.
- `ClinicFinance` table/view names remain stable even when module ownership moves.
- Temporary exceptions must be documented with an owner, removal path, and fitness-test guard.

Gate result: PASS. No unresolved clarification remains after `/speckit-clarify`.

## Project Structure

### Documentation (this feature)

```text
specs/006-modular-monolith-eda/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── clinic-finance-rest.md
│   ├── module-boundaries.md
│   └── events.md
└── tasks.md
```

### Source Code (repository root)

```text
modules/
├── Clinic/
│   ├── app/
│   │   ├── Http/Controllers/Financial*Controller.php        # legacy route handlers to migrate
│   │   ├── Http/Requests/*Financial*.php                    # request contracts to preserve
│   │   ├── Models/FinancialCategory.php                     # model ownership moves to ClinicFinance
│   │   ├── Models/FinancialTransaction.php                  # model ownership moves to ClinicFinance
│   │   ├── Models/PeriodOpeningBalance.php                  # model ownership moves to ClinicFinance
│   │   ├── Policies/Financial*.php                          # policy ownership moves with finance
│   │   ├── Repositories/Financial*.php                      # repository ownership moves with finance
│   │   └── Services/Financial*|Finance*.php                 # service ownership moves with finance
│   ├── database/
│   │   ├── factories/*Financial*.php                        # may remain temporarily whitelisted
│   │   ├── migrations/*clinic_financial*.php                # names preserved; ownership documented
│   │   └── seeders/*Financial*.php                          # may remain temporarily whitelisted
│   └── routes/clinic.php                                    # finance routes disabled after move
├── ClinicFinance/
│   ├── app/
│   │   ├── Contracts/
│   │   ├── DTO/
│   │   ├── Events/
│   │   ├── Http/Controllers/
│   │   ├── Http/Requests/
│   │   ├── Listeners/
│   │   ├── Models/
│   │   ├── Policies/
│   │   ├── Providers/
│   │   ├── Repositories/
│   │   └── Services/
│   ├── database/
│   │   ├── factories/
│   │   ├── migrations/                                      # no table renames
│   │   └── seeders/
│   ├── routes/clinic.php                                    # serves same /clinic/finances paths
│   └── tests/
│       ├── Feature/
│       └── Unit/
└── Shared or future public contracts only if a stable technical need appears

tests/
└── Architecture/
    └── ModuleBoundaryTest.php                               # production-code dependency fitness checks

docs/
└── adr/
    ├── 006-clinic-finance-extraction.md
    └── 007-clinic-finance-temporary-shared-writes.md
```

**Structure Decision**: Create a physical `modules/ClinicFinance` module first. The module owns clinic financial behavior while preserving public `/clinic/finances/*` paths. Existing financial table/view names stay stable. Legacy `modules/Clinic` finance code may coexist only as a documented transition state and must be disabled when `ClinicFinance` becomes route owner.

## Phase 0: Research

See [research.md](research.md). Key decisions:

- Physical `ClinicFinance` module first.
- Public REST paths stay unchanged.
- Existing clinic finance table/view names stay unchanged.
- Internal Laravel events now, stable/versionable payloads for future outbox.
- Fitness tests fail prohibited production-code imports.

## Phase 1: Design

See:

- [data-model.md](data-model.md)
- [contracts/clinic-finance-rest.md](contracts/clinic-finance-rest.md)
- [contracts/module-boundaries.md](contracts/module-boundaries.md)
- [contracts/events.md](contracts/events.md)
- [quickstart.md](quickstart.md)

## Post-Design Constitution Check

Gate result: PASS.

The design preserves the governance rules used above:

- `ClinicFinance` has explicit ownership of clinic financial behavior.
- Public route compatibility is documented as a contract.
- Temporary shared writes are treated as an ADR-backed exception with a removal path.
- Events are versionable payload contracts and do not expose Eloquent models.
- Dependency fitness tests protect production code immediately while allowing documented non-production whitelists.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Temporary shared writes during `ClinicFinance` migration | Allows route ownership and module ownership to move without breaking current financial flows mid-migration | Immediate exclusive ownership would increase migration blast radius before route parity and regression coverage are established |
