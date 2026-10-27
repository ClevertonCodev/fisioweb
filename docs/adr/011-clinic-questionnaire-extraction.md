# ADR-011: Extract Clinic Questionnaire Module

## Status

Accepted

## Context

Patient questionnaire behavior (templates, send flow, public answer endpoints, expiration and cancellation) lived in `modules/Clinic`, mixing bounded contexts and preventing clean extraction readiness. The feature must preserve REST paths and database table names while establishing module ownership, integration events, and decoupled WhatsApp delivery.

## Decision

- Create and enable `modules/ClinicQuestionnaire` as owner of questionnaire domain behavior.
- Keep existing REST paths:
    - `/api/clinic/questionnaire-templates/*`
    - `/api/clinic/patients/{patient}/questionnaires*`
    - `/api/questionnaires/{id}` and `/api/questionnaires/{id}/answer`
- Keep existing `clinic_questionnaire_*` and `clinic_patient_questionnaire_*` table names; move the single consolidated migration to `modules/ClinicQuestionnaire/database/migrations`.
- Controllers depend on `ServiceInterface`; services depend on `RepositoryInterface` and publish five integration events via `DB::afterCommit`.
- Patient ownership checks use `PatientServiceInterface` (public contract) instead of route-model binding on `Patient`.
- WhatsApp sends remote questionnaire links by listening to `QuestionnaireSent` in `modules/WhatsApp`, not by direct service calls from `ClinicQuestionnaire`.
- Remove questionnaire routes, bindings, policies, services, models, migrations, factories and tests from `modules/Clinic`.

## Ownership

- Module owner: `ClinicQuestionnaire`
- Owned controllers: `QuestionnaireTemplateController`, `PatientQuestionnaireController`, `QuestionnaireAnswerController`
- Owned tables:
    - `clinic_questionnaire_templates`
    - `clinic_questionnaire_sections`
    - `clinic_questionnaire_questions`
    - `clinic_patient_questionnaires`
    - `clinic_patient_questionnaire_answers`

## Integration Events

Versioned readonly events with IDs, minimal snapshot, and `occurredAt`:

- `QuestionnaireTemplateCreated`
- `QuestionnaireSent`
- `QuestionnaireAnswered`
- `QuestionnaireExpired`
- `QuestionnaireCancelled`

## Consequences

- Positive:
    - Clear module boundary and extraction readiness alignment with ADR-008/ADR-009.
    - REST compatibility preserved for SPA and public patient links.
    - WhatsApp decoupled via event listener.
- Trade-offs:
    - Cross-module `belongsTo` on `Clinic`, `ClinicUser`, and `Patient` remain via inline FQN in models (ADR-008 pattern).
    - WhatsApp listener is registered in WhatsApp module; module must be enabled for delivery.

## Follow-ups

- Introduce outbox/inbox before distributed extraction.
- Version public service contracts if cross-service consumers appear.
- Keep architecture fitness tests updated as questionnaire features evolve.
