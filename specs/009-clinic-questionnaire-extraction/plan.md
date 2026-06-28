# Implementation Plan: Clinic Questionnaire Extraction

## Bounded Context

`ClinicQuestionnaire` owns template authoring, patient questionnaire lifecycle, and public answer collection.

## Table Ownership

All `clinic_questionnaire_*` and `clinic_patient_questionnaire_*` tables owned by `ClinicQuestionnaire`.

## Public Contracts

- REST paths preserved under `/api/clinic/*` and `/api/questionnaires/*`
- `PatientServiceInterface` for patient ownership validation
- Integration events for cross-module reactions (WhatsApp)

## Temporary Couplings (ADR-011)

- Model `belongsTo` via inline FQN to `Clinic`, `ClinicUser`, `Patient` for JSON serialization
- `ClinicPatientDataSeeder` imports questionnaire models for demo data

## Fitness Tests

- `tests/Architecture/ModuleBoundaryTest` scans `ClinicQuestionnaire`
- `tests/Architecture/ExtractionReadinessTest` validates migrations and events
- Route compatibility test in module Feature tests

## Microservice Extraction Readiness

Local integration events with `DB::afterCommit`; outbox/inbox deferred per ADR-011.
