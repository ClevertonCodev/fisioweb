# Feature Specification: Clinic Questionnaire Extraction

**Feature Branch**: `009-clinic-questionnaire-extraction`

**Created**: 2026-06-28

**Status**: Implemented

## Overview

Extract patient questionnaire functionality from `modules/Clinic` into `modules/ClinicQuestionnaire`, preserving REST API contracts. Frontend is out of scope.

## Scope

- Questionnaire templates (sections, questions with JSON options)
- Patient questionnaire send, answer, expire, cancel (soft delete)
- Public answer endpoints without clinic auth
- Integration events: `QuestionnaireTemplateCreated`, `QuestionnaireSent`, `QuestionnaireAnswered`, `QuestionnaireExpired`, `QuestionnaireCancelled`
- WhatsApp reacts to `QuestionnaireSent` via listener

## Clarifications

- Module name: `ClinicQuestionnaire`
- REST paths unchanged; table names unchanged
- Migrations moved to owner module; `migrate:fresh --seed` allowed locally
