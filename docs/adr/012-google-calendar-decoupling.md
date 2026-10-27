# ADR-012: Desacoplamento do GoogleCalendar de Clinic e ClinicScheduling

**Status**: Accepted

**Date**: 2026-07-03

## Context

`modules/GoogleCalendar` escrevia diretamente em `ClinicUser` e `Appointment`, incluindo `forceFill`, `saveQuietly`, queries Eloquent e imports de Models/Enums privados de outros módulos. Isso quebrava a fronteira do monólito modular: Clinic é dono da identidade e dos tokens Google; ClinicScheduling é dono dos agendamentos e metadados de sincronização.

## Decision

GoogleCalendar passa a ser um módulo de integração pura:

- OAuth, Google API, retry/backoff e orquestração de jobs continuam em GoogleCalendar.
- `clinic_users.google_*` continua pertencendo a Clinic e só é escrito por contratos públicos de Clinic.
- `clinic_appointments.google_event_id` e `last_synced_at` continuam pertencendo a ClinicScheduling e só são escritos por contratos públicos de ClinicScheduling.
- Cross-module sync usa IDs, DTOs públicos, contratos públicos e Integration Events.
- GoogleCalendar production code não importa Models privados de Clinic/ClinicScheduling nem Enums de ClinicScheduling.

## Consequences

- O módulo GoogleCalendar fica preparado para futura extração como worker/serviço de integração.
- A persistência quieta anti-loop fica dentro do módulo dono dos dados.
- Fitness tests passam a proteger a fronteira e falham em regressões óbvias.
- A dependência em `Crypt` para OAuth state segue aceita como acoplamento de infraestrutura Laravel, não de domínio.

## Validation

- `modules/GoogleCalendar/tests/Feature/GoogleCalendarArchitectureTest.php`
- `specs/011-google-calendar-decoupling/quickstart.md`
