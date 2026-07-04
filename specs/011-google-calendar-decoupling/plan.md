# Implementation Plan: Google Calendar Decoupling

**Branch**: `011-google-calendar-decoupling` | **Date**: 2026-07-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-google-calendar-decoupling/spec.md`

## Summary

Refactor `modules/GoogleCalendar` into a pure integration module. GoogleCalendar keeps OAuth, Google API calls, retry/idempotency orchestration, jobs, and listeners, but all persistence for clinic identity and scheduling remains behind public contracts owned by `modules/Clinic` and `modules/ClinicScheduling`.

## Technical Context

**Language/Version**: PHP 8.2+, Laravel 12

**Primary Dependencies**: Google API PHP client, Nwidart Modules, Laravel Queue, Laravel Events, JWT auth guards `clinic`/`admin`

**Storage**: Existing DB tables only; no schema changes. `clinic_users.google_*` remains owned by Clinic. `clinic_appointments.google_event_id` and `last_synced_at` remain owned by ClinicScheduling.

**Testing**: PHPUnit 11 + Mockery; architecture fitness tests via PHPUnit file scanning; existing `vendor/bin/phpunit`

**Target Platform**: Laravel REST backend and queue worker

**Project Type**: Modular monolith backend refactor

**Performance Goals**: Preserve current sync batching and queue behavior; pull command chunks connected users by 100.

**Constraints**: No frontend changes; no REST path/request/response shape changes; no migration movement; no provider registration in `bootstrap/providers.php`; use module service providers and `modules_statuses`.

**Scale/Scope**: Local/dev system; all GoogleCalendar production dependencies on Clinic/ClinicScheduling must go through public contracts, DTOs, IDs, or integration events.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Modular boundary: PASS. Cross-module collaboration is explicitly through public service contracts and DTOs.
- Data ownership: PASS. No table or column ownership changes.
- Controller/service separation: PASS. Controller keeps OAuth request/response handling and delegates use cases to services/contracts.
- Async behavior: PASS. Jobs carry IDs/scalars and resolve services in `handle()`.
- Security/ownership: PASS. Existing `auth:clinic` route middleware stays in place; public callback keeps encrypted state correlation.
- Fitness coverage: PASS planned. Architecture tests are mandatory.

## Project Structure

### Documentation (this feature)

```text
specs/011-google-calendar-decoupling/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── clinic-public-contracts.md
│   ├── clinic-scheduling-public-contracts.md
│   └── google-calendar-service-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
modules/
├── Clinic/
│   └── app/
│       ├── Contracts/Public/
│       ├── Data/Public/
│       ├── Providers/ClinicServiceProvider.php
│       └── Services/
├── ClinicScheduling/
│   └── app/
│       ├── Contracts/Public/
│       ├── Data/Public/
│       ├── Providers/ClinicSchedulingServiceProvider.php
│       └── Services/
└── GoogleCalendar/
    └── app/
        ├── Console/Commands/
        ├── Contracts/
        ├── Http/Controllers/
        ├── Jobs/
        ├── Listeners/
        ├── Providers/
        └── Services/

docs/adr/
└── 012-google-calendar-decoupling.md
```

**Structure Decision**: Keep all new implementation inside existing backend modules. Public cross-module types live in `Contracts/Public` and `Data/Public` under the owning module.

## Bounded Context & Ownership

- **GoogleCalendar** owns OAuth URL/callback orchestration, Google Calendar API client usage, event push/update/delete/list operations, retry/backoff, idempotent Google delete handling, sync jobs, and listener orchestration.
- **Clinic** owns `ClinicUser`, identity, clinic user connection state, encrypted Google token persistence, sync token persistence, connected user enumeration, and `isGoogleConnected` semantics.
- **ClinicScheduling** owns `Appointment`, appointment statuses, appointment events, `google_event_id`, `last_synced_at`, and quiet persistence for external-source upserts/cancellations.

## Public Contracts

- `Modules\Clinic\Contracts\Public\ClinicUserGoogleConnectionReadServiceInterface`
- `Modules\Clinic\Contracts\Public\GoogleCalendarConnectionWriteServiceInterface`
- `Modules\Clinic\Data\Public\GoogleConnectionStateDTO`
- `Modules\Clinic\Data\Public\GoogleTokenSetDTO`
- `Modules\ClinicScheduling\Contracts\Public\AppointmentReadServiceInterface`
- `Modules\ClinicScheduling\Contracts\Public\AppointmentSyncWriteServiceInterface`
- `Modules\ClinicScheduling\Contracts\Public\AppointmentUpsertFromExternalSourceInterface`
- `Modules\ClinicScheduling\Contracts\Public\AppointmentCancelFromExternalSourceInterface`
- `Modules\ClinicScheduling\Data\Public\AppointmentSnapshotDTO`
- `Modules\ClinicScheduling\Data\Public\AppointmentExternalEventDTO`

## Events

GoogleCalendar consumes existing ClinicScheduling integration events:

- `AppointmentScheduled`
- `AppointmentRescheduled`
- `AppointmentCancelled`

GoogleCalendar may publish integration events after external API work:

- `GoogleCalendarEventPushed`
- `GoogleCalendarEventDeleted`
- `GoogleCalendarChangesPulled`

Events carry IDs, scalar snapshots, and timestamps only. Eloquent models are not event payloads.

## Anti-Loop Strategy

GoogleCalendar never calls Eloquent persistence for scheduling or clinic identity. Quiet writes move into the owning modules:

- Clinic writes Google token/sync-token state using the Clinic model and encrypted casts.
- ClinicScheduling records Google event IDs and applies external events with `saveQuietly()` / `withoutEvents()` equivalents internally.

This preserves current `saveQuietly`/`withoutEvents` behavior without leaking model ownership to GoogleCalendar.

## Future Extraction Readiness

After this refactor, GoogleCalendar can become a worker/integration service candidate because its domain dependencies are IDs, public DTOs, and service contracts. Temporary accepted infrastructure coupling: Laravel `Crypt` in the controller for OAuth state and Google SDK client creation inside the integration service.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
