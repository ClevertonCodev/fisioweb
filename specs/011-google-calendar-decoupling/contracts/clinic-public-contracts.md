# Clinic Public Contracts

## `ClinicUserGoogleConnectionReadServiceInterface`

```php
public function isConnected(int $clinicUserId): bool;
public function findByAuthenticatedClinicUser(): GoogleConnectionStateDTO;
public function findStateByUserId(int $clinicUserId): ?GoogleConnectionStateDTO;
/** @return array<int> */
public function connectedClinicUserIds(): array;
```

## `GoogleCalendarConnectionWriteServiceInterface`

```php
public function storeTokens(int $clinicUserId, GoogleTokenSetDTO $tokens): void;
public function storeSyncToken(int $clinicUserId, ?string $syncToken): void;
public function clearTokens(int $clinicUserId): void;
```

## REST Shape Preserved

- `GET /clinic/google-calendar/connect` returns `data.authorization_url`.
- `GET /clinic/google-calendar/status` returns `data.connected`, `data.google_calendar_id`, `data.connected_at`.
- `DELETE /clinic/google-calendar` returns `data.connected=false`.
- `GET /clinic/google-calendar/callback` remains public and redirects with `?google=connected` or `?google=error`.
