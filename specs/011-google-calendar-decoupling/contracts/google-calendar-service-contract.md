# GoogleCalendar Service Contract

## `GoogleCalendarServiceInterface`

```php
public function getAuthUrl(string $state): string;
public function connectFromCallback(int $clinicUserId, string $code): void;
public function disconnect(int $clinicUserId): void;
public function pushAppointment(GoogleConnectionStateDTO $connection, AppointmentSnapshotDTO $appointment): string;
public function deleteAppointment(GoogleConnectionStateDTO $connection, string $googleEventId): void;
public function pullChanges(GoogleConnectionStateDTO $connection): array;
```

No signature may mention `ClinicUser`, `Appointment`, or any private model from another module.
