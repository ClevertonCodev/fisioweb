# Quickstart: Modular Monolith EDA Validation

This guide validates the planning outcome for `ClinicFinance` extraction before implementation tasks begin.

## Prerequisites

- Dependencies installed with `composer install` and `npm install`.
- Environment configured with `.env`, app key, JWT secret, and migrated database.
- Backend tests runnable with PHPUnit.

## 1. Confirm Active Spec Kit Feature

```bash
cat .specify/feature.json
```

Expected:

- `feature_directory` points to `specs/006-modular-monolith-eda`.

## 2. Review Contracts Before Implementation

```bash
ls specs/006-modular-monolith-eda/contracts
```

Expected:

- `clinic-finance-rest.md`
- `events.md`
- `module-boundaries.md`

## 3. Baseline Existing Finance Routes

```bash
php artisan route:list --path=clinic/finances
```

Expected:

- Existing `/clinic/finances/*` paths are visible before migration.
- After `ClinicFinance` becomes route owner, the same paths remain visible.

## 4. Baseline Existing Backend Tests

```bash
vendor/bin/phpunit
```

Expected:

- Existing backend tests pass before migration begins.
- Any current failures are documented before `ClinicFinance` extraction tasks start.

## 5. Validate Route Compatibility During Implementation

After moving finance route ownership to `ClinicFinance`, run:

```bash
php artisan route:list --path=clinic/finances
vendor/bin/phpunit --filter=Finances
```

Expected:

- Public route paths remain unchanged.
- JSON envelopes remain compatible with [contracts/clinic-finance-rest.md](contracts/clinic-finance-rest.md).
- Legacy `Clinic` financial route declarations are disabled once `ClinicFinance` serves the paths.

## 6. Validate Boundary Fitness Tests

After architecture tests are added, run:

```bash
vendor/bin/phpunit --filter=ModuleBoundaryTest
```

Expected:

- Production-code imports of another module's private `Models` or `Repositories` fail.
- Tests, factories, and seeders pass only when documented in the whitelist.

## 7. Validate Event Contracts

For each `ClinicFinance` write operation that emits an event, run the relevant feature/unit tests.

Expected:

- Events use past-tense names.
- Events include IDs, clinic context, minimal snapshots, `version`, and `occurredAt`.
- Events do not expose Eloquent models.
- External-effect listeners are idempotent or queued where appropriate.
