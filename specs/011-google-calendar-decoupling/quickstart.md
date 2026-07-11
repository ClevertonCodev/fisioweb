# Quickstart: Google Calendar Decoupling Validation

## Static Boundary Checks

```bash
./vendor/bin/phpunit --filter GoogleCalendarArchitectureTest
```

Expected:

- GoogleCalendar production files import no private Clinic/ClinicScheduling Models.
- GoogleCalendar production files import no ClinicScheduling Enums.
- GoogleCalendar production files contain no `forceFill(`.
- GoogleCalendar service interface has no `ClinicUser` or `Appointment` model signatures.

## Backend Tests

```bash
./vendor/bin/phpunit modules/GoogleCalendar/tests
./vendor/bin/phpunit modules/Clinic/tests
./vendor/bin/phpunit modules/ClinicScheduling/tests
```

Expected:

- Existing Google Calendar route paths and response shapes remain stable.
- Jobs use mocked public contracts and do not require Eloquent models from other modules.
- Public contracts persist token and scheduling sync state in owner modules.

## Optional Full Local Reset

```bash
php artisan migrate:fresh --seed
./vendor/bin/phpunit --filter GoogleCalendar
```

Expected: schema ownership is unchanged and Google Calendar integration tests pass.
