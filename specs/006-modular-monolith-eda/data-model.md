# Data Model: Modular Monolith EDA

## Business Capability

Represents a cohesive backend business responsibility.

**Fields**

- `name`: Canonical capability name, for example `ClinicFinance`.
- `scope`: Business scope, for example `clinic`, `admin`, `patient`, `platform`.
- `ownerModule`: Physical module that owns the behavior.
- `ownedTables`: Table/view names owned by the capability.
- `publicContracts`: Approved service interfaces, DTOs, events, endpoints, or read projections.
- `temporaryExceptions`: ADR-backed exceptions with removal path.

**Validation Rules**

- Capability names must map to business meaning, not technical layers.
- Clinic-scoped modules must include the clinic context in the name when ambiguity exists, for example `ClinicFinance`.
- A table/view has exactly one final owner.

## ClinicFinance Module

First physical clinic-scoped module extracted from legacy `modules/Clinic`.

**Owned Behavior**

- Financial transactions.
- Financial categories and clinic overrides.
- Monthly opening balances.
- Summary metrics.
- Finance reports.
- CSV/XLSX/PDF financial exports.

**Owned Tables/Views**

- `clinic_financial_categories`
- `clinic_financial_category_overrides`
- `clinic_financial_opening_balances`
- `clinic_financial_transactions`
- Any existing clinic financial views, preserving their names.

**Relationships**

- Belongs to clinic identity by `clinic_id`.
- References creating clinic user by identifier/snapshot, not by importing `ClinicUser` for business rules.
- May publish events consumed by dashboard, audit/activity, export, notification, or future reporting capabilities.

**State Transitions**

- `LegacyOwned`: financial code and routes still live in `modules/Clinic`.
- `SharedTransition`: `ClinicFinance` exists and may share writes temporarily under ADR.
- `RouteOwner`: `ClinicFinance` serves the same public `/clinic/finances/*` routes.
- `ExclusiveOwner`: legacy clinic financial routes/code are disabled or removed; new finance rules cannot be added to `modules/Clinic`.

## Module Boundary

Defines allowed and forbidden dependency directions.

**Fields**

- `producerModule`: Module owning the behavior/fact/data.
- `consumerModule`: Module using a public collaboration path.
- `allowedMechanism`: One of `public_service_interface`, `dto`, `event`, `endpoint`, `read_projection`.
- `forbiddenMechanisms`: Direct model imports, repository imports, private migration/table writes, Eloquent model event payloads.
- `enforcement`: Fitness test rule and optional whitelist entry.

**Validation Rules**

- Production code cannot import another module's `Models` or `Repositories` for business rules.
- `RepositoryInterface` remains internal unless an ADR explicitly says otherwise.
- Non-production exceptions must be documented and whitelisted.

## Business Event

Stable statement that something already happened.

**Fields**

- `eventName`: Past-tense name, for example `FinancialTransactionRecorded`.
- `version`: Integer payload version for durable cross-module use.
- `aggregateId`: Identifier of the source aggregate.
- `clinicId`: Tenant/clinic context when applicable.
- `actorId`: User/actor identifier when relevant.
- `snapshot`: Minimal business facts required by consumers.
- `occurredAt`: Immutable occurrence timestamp.

**Validation Rules**

- Events must not carry Eloquent models.
- Events must be emitted by the module owning the fact.
- Listeners must live in the module owning the consequence.
- Queued or external-effect listeners must be idempotent.

## Public Contract

Stable collaboration surface for synchronous interactions.

**Fields**

- `name`: Contract name.
- `ownerModule`: Module publishing the contract.
- `method`: Business operation exposed.
- `inputDto`: Stable readonly input shape where needed.
- `outputDto`: Stable readonly output shape.
- `stability`: `internal_public`, `integration_ready`, or `temporary`.

**Validation Rules**

- DTOs must not expose table implementation details.
- Callers must not receive Eloquent models as cross-module contracts.
- Contracts must be covered by tests when used across module boundaries.

## Architecture Decision Record

Durable record of boundary decisions and exceptions.

**Fields**

- `title`
- `context`
- `decision`
- `consequences`
- `rulesToPreserve`
- `futureExtractionImpact`
- `removalPath` for exceptions.

**Validation Rules**

- Any temporary shared write requires an ADR.
- Any durable exception to dependency rules requires an ADR.

## Dependency Fitness Check

Automated rule protecting module boundaries.

**Fields**

- `ruleName`
- `sourceScope`
- `forbiddenPattern`
- `allowedPatterns`
- `whitelistFile`
- `failureMessage`

**Validation Rules**

- Production-code violations fail tests.
- Tests, factories, and seeders may be whitelisted with reason and removal path.
- Checks must cover new `ClinicFinance` boundaries from the first phase.
