# Research: Modular Monolith EDA

## Decision: Extract `ClinicFinance` as the first physical clinic-scoped module

**Rationale**: Finance already has a cohesive vocabulary: transactions, categories, opening balances, summaries, reports, and exports. It is smaller and clearer than the whole clinic area, and future admin finance will need separate ownership, so a clinic-scoped name avoids domain confusion.

**Alternatives considered**:

- Start with internal boundaries inside `modules/Clinic`: safer in production, but the project is still local/dev and the user wants physical modules now.
- Start with `ClinicScheduling`: valuable, but has more immediate integration pressure with patients, professionals, Google Calendar, and notifications.
- Start with `ClinicIdentity`: important for later contracts, but less aligned with the current finance-first clarification.

## Decision: Keep public `/clinic/finances/*` route paths stable

**Rationale**: The frontend must not change. Route ownership can move from `modules/Clinic` to `modules/ClinicFinance`, but path, request shape, response shape, authorization semantics, and user-visible flow must stay compatible.

**Alternatives considered**:

- Versioned finance routes under a new prefix: cleaner from a module viewpoint, but breaks the stated frontend constraint.
- Internal proxy routes in legacy `Clinic` forever: preserves paths, but hides ownership and keeps the old module as a permanent coupling point.

## Decision: Preserve existing clinic financial table and view names

**Rationale**: Names such as `clinic_financial_categories`, `clinic_financial_category_overrides`, `clinic_financial_opening_balances`, and `clinic_financial_transactions` are already domain-specific and stable. Renaming them would create migration churn without improving modularity.

**Alternatives considered**:

- Rename tables to remove the `clinic_` prefix: not useful because the target module remains clinic-scoped.
- Create duplicate tables in `ClinicFinance`: unnecessary and risks data drift.

## Decision: Allow temporary shared writes only as a documented transition state

**Rationale**: The migration can proceed safely while controllers, services, policies, and routes move. The exception must have an ADR, owner, removal path, and fitness-test guard so it does not become permanent architecture.

**Alternatives considered**:

- Immediate single-owner writes: ideal end state, but higher blast radius before route parity tests exist.
- Indefinite shared writes: operationally convenient, but violates module ownership and extraction readiness.

## Decision: Use internal Laravel events with stable, versionable payloads

**Rationale**: The first migration remains inside a single deploy and should not pay distributed-system cost yet. Payloads should still be shaped as integration contracts: IDs, clinic context, minimal snapshots, `occurredAt`, and version where durable.

**Alternatives considered**:

- Laravel events with casual payloads: faster but creates rework when outbox or external messaging arrives.
- Outbox/inbox immediately: stronger delivery guarantees but unnecessary complexity for the first local/dev migration.

## Decision: Add dependency fitness tests that fail production-code violations

**Rationale**: The project is still local/dev, so it can adopt strict production-code boundaries early. Tests, factories, and seeders are allowed through documented whitelists because setup code often needs richer object graphs during migration.

**Alternatives considered**:

- Fail all imports everywhere: too disruptive for test setup during refactor.
- Report-only checks: too weak; new coupling could grow while the migration is underway.

## Decision: Treat public service interfaces and DTOs as public contracts, not repositories

**Rationale**: Repository interfaces are internal persistence contracts. Cross-module calls that need immediate answers should use application service interfaces and readonly DTO snapshots. Effects that do not need immediate response should use events.

**Alternatives considered**:

- Inject repositories across modules: direct violation of the modular monolith boundary rules.
- Use events for every interaction: wrong for critical synchronous validation or immediate read needs.
