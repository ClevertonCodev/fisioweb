# Contract: Backend Module Boundaries

## Public Collaboration Paths

Modules may collaborate only through:

- Public application service interfaces.
- Readonly DTOs.
- Domain/integration events with stable payloads.
- Existing REST endpoints.
- Read projections owned by the consumer.

## Forbidden In Production Code

- Importing another module's `Models` for business rules.
- Importing another module's `Repositories`.
- Injecting another module's `RepositoryInterface`.
- Writing to another module's owned table after the transition exception expires.
- Passing Eloquent models as event payloads.
- Hiding shared business rules in global helpers or generic services.

## First-Phase Fitness Test Scope

Production code under `modules/*/app/**/*.php` must fail when it introduces a prohibited dependency.

Current implemented scan target:

- `modules/ClinicFinance/app/**/*.php`

Allowed with documented whitelist:

- `modules/*/tests/**`
- `modules/*/database/factories/**`
- `modules/*/database/seeders/**`
- Temporary migration support files tied to an ADR.

Whitelist fixture:

- `tests/Architecture/fixtures/module-boundary-whitelist.php`

Capability ownership fixture:

- `tests/Architecture/fixtures/clinic-capability-map.php`

## `ClinicFinance` Boundary Rules

- `ClinicFinance` owns clinic financial transactions, categories, opening balances, summaries, reports, and exports.
- Existing tables/views keep names such as `clinic_financial_categories`.
- Legacy `Clinic` finance writes are temporary only.
- After route ownership moves, legacy `Clinic` financial route declarations must be disabled.
- New clinic financial rules must be added to `ClinicFinance`, not `Clinic`.

## Required ADRs

- `ClinicFinance` physical extraction and route ownership transfer.
- Temporary shared writes between `Clinic` and `ClinicFinance`.
- Any long-lived exception to model/repository import rules.

## Implemented Guardrails

- `tests/Architecture/ModuleBoundaryTest.php`
- `tests/Architecture/ClinicScopedModuleNamingTest.php`
- `tests/Architecture/ExtractionReadinessTest.php`
