# Data Model: Google Calendar Decoupling

## GoogleConnectionStateDTO

- `clinicUserId`: int
- `clinicId`: int
- `connected`: bool
- `accessToken`: ?string
- `refreshToken`: ?string
- `tokenExpiresAt`: ?CarbonImmutable
- `calendarId`: ?string
- `syncToken`: ?string
- `connectedAt`: ?CarbonImmutable

State owner: Clinic. Token encryption is provided by existing ClinicUser casts.

## GoogleTokenSetDTO

- `accessToken`: ?string
- `refreshToken`: ?string
- `expiresAt`: ?CarbonImmutable
- `calendarId`: string
- `syncToken`: ?string
- `connectedAt`: CarbonImmutable

State owner: Clinic. Used when OAuth callback or token refresh returns credentials.

## AppointmentSnapshotDTO

- `id`: int
- `clinicId`: int
- `clinicUserId`: ?int
- `patientId`: ?int
- `title`: ?string
- `description`: ?string
- `location`: ?string
- `startsAt`: CarbonImmutable
- `endsAt`: CarbonImmutable
- `timezone`: string
- `googleEventId`: ?string
- `status`: string

State owner: ClinicScheduling. Used by GoogleCalendar to build Google API event payloads.

## AppointmentExternalEventDTO

- `clinicId`: int
- `clinicUserId`: int
- `patientId`: ?int
- `externalEventId`: string
- `title`: string
- `description`: ?string
- `location`: ?string
- `startsAt`: CarbonImmutable
- `endsAt`: CarbonImmutable
- `status`: string
- `source`: string
- `syncedAt`: CarbonImmutable

State owner: ClinicScheduling. Used to apply Google-originated changes.

## State Transitions

- Disconnected connection state becomes connected only through Clinic write contract storing a token set.
- Connected connection state becomes disconnected only through Clinic write contract clearing tokens.
- Appointment external upsert creates or updates the appointment tied to `externalEventId`.
- Appointment external cancellation changes status through ClinicScheduling without firing outbound sync events.
