# ADR-010: Extract Treatment Program Module

## Status

Accepted

## Context

Treatment program behavior (treatment plans, prescribed exercise groups, prescribed exercises, program drafts, PDF generation entrypoints and shared program catalog browsing) was implemented inside `modules/Clinic`. That mixed prescription ownership with clinic dashboard, identity and other clinic capabilities, and left business code coupled to Admin exercise/program models and model observers for WhatsApp side effects.

The extraction follows ADR-008 and ADR-009: keep HTTP and database compatibility, move ownership to a dedicated bounded context, and protect the boundary with public contracts and integration events.

## Decision

- Create and enable `modules/TreatmentProgram` as the owner of prescription behavior.
- Keep existing REST paths, route names and response shapes under `/api/clinic/*`.
- Keep existing `clinic_treatment_*` and `clinic_program_drafts` table names and move all five migrations to `modules/TreatmentProgram/database/migrations`.
- Move prescription controllers, requests, models, policies, repositories, services, seeders, events and tests to `TreatmentProgram`.
- Consume Admin exercise defaults through `ExerciseCatalogReadServiceInterface` instead of importing `Admin\Models\Exercise` in services.
- Consume Admin shared programs through `ProgramCatalogReadServiceInterface` instead of importing `Admin\Models\AdminProgram` in controllers.
- Expose `TreatmentProgramReadServiceInterface` for the Clinic dashboard `active_programs` count.
- Publish seven integration events through `DB::afterCommit` with IDs and minimal snapshots only.
- Replace `TreatmentPlanObserver` with `SendTreatmentPlanActivationNotification`, a listener for `TreatmentPlanActivated`.
- Keep cross-module belongsTo relations in TreatmentProgram models with inline FQN references only, as established by ADR-008.
- Remove prescription routes, bindings, policies and observers from `modules/Clinic`.

## Ownership

- Module owner: `TreatmentProgram`
- Owned controllers: `TreatmentPlanController`, `ProgramDraftController`, `SharedProgramController`
- Owned tables:
    - `clinic_treatment_plans`
    - `clinic_treatment_plan_groups`
    - `clinic_treatment_plan_exercises`
    - `clinic_program_drafts`

## Accepted Coupling

`TreatmentProgram` continues to call `Modules\Clinic\Contracts\ActivityLoggerInterface` for `ProgramCreated`, `ProgramCompleted` and `ExercisesAdded`.

Reason: the Clinic dashboard activity feed must remain byte-for-byte compatible during this extraction, and the existing activity log belongs to Clinic. The dependency is a public service interface, not a private Model or Repository.

Containment: `ModuleBoundaryTest` permits this service-interface dependency while still blocking private cross-module model imports in services, repositories and controllers.

Removal plan: move activity recording to a Clinic listener that consumes TreatmentProgram events. That follow-up should add any missing event granularity needed for `ExercisesAdded` before removing the direct logger call.

## Consequences

- Positive:
    - Prescription ownership is explicit and isolated from the Clinic shell.
    - Route and response compatibility are preserved for the SPA.
    - Dashboard `active_programs` reads through a public TreatmentProgram contract.
    - WhatsApp activation is driven by an integration event instead of an Eloquent observer.
    - Fitness tests now guard ownership, route compatibility and event payload boundaries.
- Trade-offs:
    - Admin public read contracts must preserve serialized shapes used by existing endpoints.
    - Activity logging remains a documented temporary coupling.
    - Events are local-process integration events until outbox/inbox is introduced.

## Follow-ups

- Move activity logging to a Clinic-side listener after adding event coverage for exercise-list changes.
- Introduce outbox/inbox and idempotency infrastructure before distributed extraction.
- Version public contracts if cross-service consumers are introduced.
- Keep architecture fitness tests updated as new TreatmentProgram features are added.
