# ClinicScheduling Public Contracts

## `AppointmentReadServiceInterface`

```php
public function getSnapshotById(int $appointmentId): ?AppointmentSnapshotDTO;
public function findIdByExternalEventId(int $clinicId, string $externalEventId): ?int;
```

## `AppointmentSyncWriteServiceInterface`

```php
public function recordGoogleEventId(int $appointmentId, string $googleEventId, CarbonImmutable $syncedAt): void;
```

## `AppointmentUpsertFromExternalSourceInterface`

```php
public function upsertFromExternalSource(AppointmentExternalEventDTO $event): int;
```

## `AppointmentCancelFromExternalSourceInterface`

```php
public function cancelFromExternalSource(int $appointmentId, CarbonImmutable $occurredAt): void;
```

Quiet persistence belongs to concrete ClinicScheduling implementations.
