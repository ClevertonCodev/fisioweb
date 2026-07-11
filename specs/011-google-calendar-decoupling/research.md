# Research: Google Calendar Decoupling

## Decision: Public contracts live in owner modules

**Rationale**: Clinic owns `clinic_users.google_*` and ClinicScheduling owns `clinic_appointments.google_event_id` / `last_synced_at`. Contracts in `Contracts/Public` make ownership explicit and keep GoogleCalendar from depending on private Models or Repositories.

**Alternatives considered**: Moving fields into GoogleCalendar tables was rejected because scope forbids schema changes. Shared repositories were rejected because they blur ownership.

## Decision: DTOs live in owner module `Data/Public`

**Rationale**: DTOs provide stable cross-module shapes without exposing Eloquent models. They are easier to mock in job/service tests and future extraction.

**Alternatives considered**: Arrays were rejected because they hide required fields and invite shape drift.

## Decision: Quiet persistence remains inside ClinicScheduling

**Rationale**: Anti-loop behavior is a scheduling persistence concern. GoogleCalendar should request "apply this external event" or "record this Google event ID"; ClinicScheduling decides how to avoid firing its own observers/events.

**Alternatives considered**: Passing a "quiet" flag from GoogleCalendar was rejected because it leaks persistence mechanics across the boundary.

## Decision: Pull command enumerates connected users through Clinic

**Rationale**: Connected user discovery depends on `ClinicUser.google_connected_at`, so Clinic must own the query.

**Alternatives considered**: Keeping `ClinicUser::whereNotNull()` in GoogleCalendar was rejected by the module boundary requirement.

## Decision: Fitness tests scan production PHP files

**Rationale**: The failure mode is architectural regression. Lightweight tests that scan imports/signatures/forbidden calls are fast, deterministic, and directly express the boundary rules.

**Alternatives considered**: Relying on code review only was rejected because the previous coupling already existed.
