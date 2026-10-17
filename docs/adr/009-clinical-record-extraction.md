# ADR-009: Extract Clinical Record Module

## Status

Accepted

## Context

Clinical record behavior (assessment, evolution, evolution templates and patient files) was still implemented in `modules/Clinic`, creating mixed ownership and weak module boundaries. The extraction follows ADR-008 principles: keep route and database compatibility, isolate ownership, and allow future extraction readiness through explicit contracts and integration events.

## Decision

- Create and enable `modules/ClinicalRecord` as the owner of clinical record domain behavior.
- Keep existing REST paths and response shapes under `/api/clinic/*`.
- Keep existing `clinic_*` table names and move all ten clinical record migrations to `modules/ClinicalRecord/database/migrations`.
- Expose an Admin public contract `AssessmentTemplateReadServiceInterface` and consume it from `ClinicalRecord` instead of importing Admin models in services/controllers.
- Refactor ClinicalRecord write services to use repository interfaces and publish six integration events via `DB::afterCommit`.
- Keep cross-module belongsTo relations in ClinicalRecord models with inline FQN references (no top-level external model imports), as established by ADR-008 boundary rules.
- Remove clinical record routes, bindings and policies from `modules/Clinic`.

## Ownership

- Module owner: `ClinicalRecord`
- Owned controllers: `AssessmentController`, `EvolutionController`, `EvolutionTemplateController`, `PatientFileController`, `SharedAssessmentTemplateController`
- Owned tables:
    - `clinic_assessments`
    - `clinic_assessment_answers`
    - `clinic_assessment_answer_options`
    - `clinic_evolution_templates`
    - `clinic_evolution_template_sections`
    - `clinic_evolution_template_items`
    - `clinic_patient_evolutions`
    - `clinic_patient_evolution_checked_items`
    - `clinic_patient_files`

## Consequences

- Positive:
    - Stronger module boundary and clearer ownership.
    - Route compatibility preserved for frontend and external clients.
    - Event publication ready for future consumers.
    - `Clinic` module reduced to its remaining capabilities.
- Trade-offs:
    - Public read-model contract on Admin side must be maintained.
    - Events are local-process integration events until outbox/inbox is introduced.

## Follow-ups

- Introduce outbox/inbox and idempotency infrastructure before distributed extraction.
- Version externalized public contracts if cross-service consumers are introduced.
- Keep architecture fitness tests updated as new ClinicalRecord features are added.
