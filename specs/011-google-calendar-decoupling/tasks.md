# Tasks: Google Calendar Decoupling

**Input**: Design documents from `/specs/011-google-calendar-decoupling/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by feature request, including architecture fitness tests and unit/feature tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish public DTO and contract surface owned by Clinic and ClinicScheduling.

- [X] T001 [P] Create Clinic public Google DTOs in modules/Clinic/app/Data/Public/
- [X] T002 [P] Create Clinic public Google contracts in modules/Clinic/app/Contracts/Public/
- [X] T003 [P] Create ClinicScheduling public appointment DTOs in modules/ClinicScheduling/app/Data/Public/
- [X] T004 [P] Create ClinicScheduling public appointment contracts in modules/ClinicScheduling/app/Contracts/Public/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement owner-module services and bind public contracts before GoogleCalendar can consume them.

- [X] T005 Implement Clinic Google connection public service in modules/Clinic/app/Services/GoogleCalendarConnectionService.php
- [X] T006 Bind Clinic Google public contracts in modules/Clinic/app/Providers/ClinicServiceProvider.php
- [X] T007 Implement ClinicScheduling external appointment public service in modules/ClinicScheduling/app/Services/AppointmentExternalSyncService.php
- [X] T008 Bind ClinicScheduling public appointment contracts in modules/ClinicScheduling/app/Providers/ClinicSchedulingServiceProvider.php
- [X] T009 [P] Add architecture fitness tests in modules/GoogleCalendar/tests/Feature/GoogleCalendarArchitectureTest.php

**Checkpoint**: Public contracts exist and are bound; architecture tests can detect current coupling.

---

## Phase 3: User Story 1 - Connect and Manage Google Account (Priority: P1) MVP

**Goal**: Preserve OAuth connect/status/disconnect behavior while moving ClinicUser persistence behind public Clinic contracts.

**Independent Test**: Existing Google Calendar connection endpoints keep response shape and production code no longer imports `ClinicUser`.

### Tests for User Story 1

- [X] T010 [US1] Update GoogleCalendar connection feature tests in modules/GoogleCalendar/tests/Feature/GoogleCalendarConnectionTest.php

### Implementation for User Story 1

- [X] T011 [US1] Update GoogleCalendarServiceInterface signatures in modules/GoogleCalendar/app/Contracts/GoogleCalendarServiceInterface.php
- [X] T012 [US1] Refactor GoogleCalendarService token connection and refresh through Clinic public contracts in modules/GoogleCalendar/app/Services/GoogleCalendarService.php
- [X] T013 [US1] Refactor GoogleCalendarController to use IDs and Clinic public read contract in modules/GoogleCalendar/app/Http/Controllers/GoogleCalendarController.php
- [X] T014 [US1] Refactor PullGoogleCalendarCommand to enumerate connected users through Clinic public read contract in modules/GoogleCalendar/app/Console/Commands/PullGoogleCalendarCommand.php

**Checkpoint**: OAuth/status/disconnect works without GoogleCalendar importing Clinic models.

---

## Phase 4: User Story 2 - Push Scheduling Changes to Google (Priority: P2)

**Goal**: Push/update/delete Google events from scheduling integration events using only IDs, DTOs, and public contracts.

**Independent Test**: Sync job uses mocked public contracts and writes Google event ID through ClinicScheduling public write contract.

### Tests for User Story 2

- [X] T015 [US2] Update SyncAppointmentToGoogleJob unit tests in modules/GoogleCalendar/tests/Unit/SyncAppointmentToGoogleJobTest.php

### Implementation for User Story 2

- [X] T016 [US2] Refactor SyncAppointmentToGoogleJob to use public read/write contracts in modules/GoogleCalendar/app/Jobs/SyncAppointmentToGoogleJob.php
- [X] T017 [US2] Refactor SyncSchedulingToGoogle listener to use event IDs and public Clinic read contract in modules/GoogleCalendar/app/Listeners/SyncSchedulingToGoogle.php

**Checkpoint**: Outbound sync has no GoogleCalendar dependency on Appointment model.

---

## Phase 5: User Story 3 - Pull Google Changes into Scheduling (Priority: P3)

**Goal**: Apply Google-originated changes through public ClinicScheduling contracts and persist sync tokens through Clinic.

**Independent Test**: Pull job uses mocked public contracts and never creates/updates/cancels Appointment directly.

### Tests for User Story 3

- [X] T018 [P] [US3] Add PullGoogleCalendarJob unit tests in modules/GoogleCalendar/tests/Unit/PullGoogleCalendarJobTest.php

### Implementation for User Story 3

- [X] T019 [US3] Refactor PullGoogleCalendarJob to use public Clinic and ClinicScheduling contracts in modules/GoogleCalendar/app/Jobs/PullGoogleCalendarJob.php

**Checkpoint**: Inbound sync has no GoogleCalendar dependency on ClinicUser, Appointment, or AppointmentStatus.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, events, style, and validation.

- [X] T020 [P] Add GoogleCalendar integration events in modules/GoogleCalendar/app/Events/
- [X] T021 [P] Add ADR in docs/adr/012-google-calendar-decoupling.md
- [X] T022 Run targeted PHPUnit validation for GoogleCalendar boundaries and jobs
- [X] T023 Run Laravel Pint on touched PHP files
- [X] T024 Verify no forbidden GoogleCalendar imports or forceFill calls remain in production files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all stories.
- **US1 (Phase 3)**: Depends on Foundational.
- **US2 (Phase 4)**: Depends on Foundational and service interface updates from US1.
- **US3 (Phase 5)**: Depends on Foundational and service interface updates from US1.
- **Polish (Phase 6)**: Depends on desired user stories.

### User Story Dependencies

- **User Story 1 (P1)**: MVP; no dependency on US2/US3.
- **User Story 2 (P2)**: Needs public contracts and new GoogleCalendarService signatures.
- **User Story 3 (P3)**: Needs public contracts and new GoogleCalendarService signatures.

### Parallel Opportunities

- T001-T004 can be created in parallel.
- T009 can be implemented while services are being written.
- T018, T020, and T021 are independent after the core contract surface exists.

## Implementation Strategy

### MVP First

1. Complete T001-T014 to preserve account connection without private Clinic model imports.
2. Run connection and architecture tests.
3. Complete outbound and inbound sync refactors.
4. Run all targeted backend tests and static boundary checks.
