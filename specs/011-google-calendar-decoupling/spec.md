# Feature Specification: Google Calendar Decoupling

**Feature Branch**: `011-google-calendar-decoupling`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "Desacoplar o módulo GoogleCalendar dos internals de Clinic e ClinicScheduling usando Spec Kit, mantendo rotas REST, tabelas e comportamento atuais."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect and Manage Google Account (Priority: P1)

As a clinic user, I can connect, inspect, and disconnect my Google Calendar account exactly as before, while the Clinic module remains the owner of identity and token persistence.

**Why this priority**: OAuth and connection state are the front door of the integration; without this, no sync flow can be trusted.

**Independent Test**: Exercise the existing Google Calendar connection endpoints and verify the same response shape while production GoogleCalendar code has no dependency on `ClinicUser` internals.

**Acceptance Scenarios**:

1. **Given** an authenticated clinic user, **When** they request the connection URL, **Then** the response contains `data.authorization_url` with the encrypted state correlation preserved.
2. **Given** a valid OAuth callback code and state, **When** GoogleCalendar completes the callback, **Then** token state is persisted through a public Clinic contract and the user is redirected with `google=connected`.
3. **Given** an authenticated clinic user with Google connected, **When** they disconnect, **Then** token state is cleared through a public Clinic contract and the response remains `data.connected=false`.

---

### User Story 2 - Push Scheduling Changes to Google (Priority: P2)

As the system, when ClinicScheduling publishes appointment integration events, GoogleCalendar pushes, updates, or deletes Google events using only IDs, snapshots, and public contracts.

**Why this priority**: This removes the direct write to `clinic_appointments` from the GoogleCalendar job while preserving outbound sync behavior.

**Independent Test**: Dispatch scheduling integration events/jobs using mocked public contracts and verify GoogleCalendar never imports `Appointment` or writes appointment fields directly.

**Acceptance Scenarios**:

1. **Given** an appointment scheduled or rescheduled event with a professional ID, **When** the professional is connected to Google, **Then** GoogleCalendar dispatches an upsert job with the appointment ID only.
2. **Given** an upsert job receives an appointment ID, **When** a public ClinicScheduling read contract returns a snapshot, **Then** GoogleCalendar creates or updates the Google event and records the Google event ID through a public ClinicScheduling write contract.
3. **Given** an appointment cancelled event with an existing Google event ID, **When** the professional is connected, **Then** GoogleCalendar deletes the Google event idempotently without reading the Appointment model.

---

### User Story 3 - Pull Google Changes into Scheduling (Priority: P3)

As the system, when GoogleCalendar pulls external events, it applies changes by calling public ClinicScheduling contracts, preserving idempotency and avoiding sync loops.

**Why this priority**: Pull sync is the remaining direct cross-module write path and must be owned by ClinicScheduling.

**Independent Test**: Run the pull job with mocked Google service results and public module contracts; verify external events are upserted/cancelled without direct model writes from GoogleCalendar.

**Acceptance Scenarios**:

1. **Given** a connected clinic user, **When** GoogleCalendar pulls active timed events, **Then** it sends external event DTOs to ClinicScheduling for upsert.
2. **Given** GoogleCalendar pulls a cancelled Google event, **When** ClinicScheduling can identify the appointment by external event ID, **Then** cancellation is applied by ClinicScheduling with anti-loop persistence.
3. **Given** Google returns a next sync token, **When** pull completes, **Then** the sync token is persisted through a public Clinic contract.

### Edge Cases

- OAuth callback with missing or invalid `code`/`state` redirects with `google=error` and does not persist tokens.
- Google token refresh preserves an existing refresh token when Google does not send a replacement.
- All-day Google events without a concrete date-time are ignored for appointment creation.
- Google event deletion is idempotent when Google returns not found or gone.
- Sync persistence must not trigger another scheduling event that re-enters GoogleCalendar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: GoogleCalendar production code MUST NOT import `Modules\Clinic\Models\*`, `Modules\ClinicScheduling\Models\*`, or `Modules\ClinicScheduling\Enums\*`.
- **FR-002**: GoogleCalendar production code MUST interact with Clinic only through public Clinic contracts, public DTOs, IDs, or integration events.
- **FR-003**: GoogleCalendar production code MUST interact with ClinicScheduling only through public ClinicScheduling contracts, public DTOs, IDs, or integration events.
- **FR-004**: GoogleCalendar MUST NOT call `forceFill`, `saveQuietly`, `create`, `update`, or `delete` on Models owned by Clinic or ClinicScheduling.
- **FR-005**: Existing Google Calendar REST paths and response/request shapes MUST remain unchanged.
- **FR-006**: Clinic MUST remain owner of all `google_*` fields on `clinic_users`, including encrypted token persistence.
- **FR-007**: ClinicScheduling MUST remain owner of `google_event_id` and `last_synced_at` on `clinic_appointments`.
- **FR-008**: Public Clinic contracts MUST expose reading Google connection state, storing token sets, storing sync tokens, clearing tokens, and listing connected user IDs for pull dispatch.
- **FR-009**: Public ClinicScheduling contracts MUST expose appointment snapshots, external source upsert, external source cancellation, and Google event sync write operations.
- **FR-010**: GoogleCalendar jobs MUST carry IDs and simple scalar action data, not Eloquent models.
- **FR-011**: Scheduling integration events consumed by GoogleCalendar MUST carry IDs and minimal snapshots, not Eloquent models.
- **FR-012**: Anti-loop behavior MUST be preserved by placing quiet persistence logic inside the module that owns the data.
- **FR-013**: OAuth state correlation MUST continue using encrypted state data and the callback route must remain public.
- **FR-014**: Fitness tests MUST protect module boundaries, route stability, service interface signatures, public contract existence, listener imports, and job imports.

### Key Entities *(include if feature involves data)*

- **Google Connection State**: Public Clinic DTO containing clinic user ID, clinic ID, connection flag, token fields, calendar ID, sync token, and timestamps needed by GoogleCalendar.
- **Google Token Set**: Public Clinic DTO containing access token, optional refresh token, expiration timestamp, calendar ID, optional sync token, and connected timestamp.
- **Appointment Snapshot**: Public ClinicScheduling DTO containing only fields needed to build a Google event and decide sync behavior.
- **External Appointment Event**: Public ClinicScheduling DTO representing a Google-originated event that may be upserted or cancelled.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All Google Calendar connection endpoints keep their existing paths and JSON shapes in automated tests.
- **SC-002**: Architecture fitness tests fail if GoogleCalendar imports private Clinic/ClinicScheduling Models or ClinicScheduling Enums.
- **SC-003**: Architecture fitness tests fail if GoogleCalendar contains `forceFill(` in production files.
- **SC-004**: Unit tests cover outbound sync, inbound pull, token persistence, sync-token persistence, and disconnected-user no-op behavior through public contract mocks.
- **SC-005**: The GoogleCalendar service interface exposes no parameters typed as `ClinicUser` or `Appointment`.
- **SC-006**: The backend test command can validate the new boundary tests without requiring frontend changes.

## Assumptions

- Existing database tables and columns remain unchanged.
- The module registration pattern remains module service providers plus `modules_statuses`; providers are not added to `bootstrap/providers.php`.
- Frontend behavior and route consumers are outside scope.
- Local/dev can use `migrate:fresh --seed` if full database validation is needed.
- The Google SDK remains the integration client for Google Calendar API calls.
