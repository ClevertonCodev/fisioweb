# Contract: Event Payloads

Events are in-process Laravel events during the first migration, but payloads must be stable enough to become outbox messages later. Names are past tense. Payloads carry IDs and minimum snapshots, never Eloquent models.

## Common Fields

- `version`: integer payload version.
- `clinicId`: clinic/tenant context.
- `occurredAt`: immutable occurrence timestamp.
- `actorId`: acting clinic user/admin ID when relevant.

## ClinicFinance Events

### FinancialTransactionRecorded

Published when a clinic financial transaction is created.

```php
final readonly class FinancialTransactionRecorded
{
    public function __construct(
        public int $version,
        public int $transactionId,
        public int $clinicId,
        public ?int $actorId,
        public string $type,
        public string $status,
        public string $amount,
        public string $date,
        public ?int $categoryId,
        public CarbonImmutable $occurredAt,
    ) {}
}
```

### FinancialTransactionUpdated

Published when a clinic financial transaction changes in a way consumers may care about.

```php
final readonly class FinancialTransactionUpdated
{
    public function __construct(
        public int $version,
        public int $transactionId,
        public int $clinicId,
        public ?int $actorId,
        public array $changedFields,
        public string $status,
        public string $amount,
        public string $date,
        public CarbonImmutable $occurredAt,
    ) {}
}
```

### FinancialTransactionDeleted

Published when a clinic financial transaction is soft-deleted.

```php
final readonly class FinancialTransactionDeleted
{
    public function __construct(
        public int $version,
        public int $transactionId,
        public int $clinicId,
        public ?int $actorId,
        public CarbonImmutable $occurredAt,
    ) {}
}
```

### FinancialCategoryCreated

Published when a clinic finance category is created.

```php
final readonly class FinancialCategoryCreated
{
    public function __construct(
        public int $version,
        public int $categoryId,
        public int $clinicId,
        public ?int $actorId,
        public string $name,
        public string $type,
        public CarbonImmutable $occurredAt,
    ) {}
}
```

### OpeningBalanceUpdated

Published when a clinic period opening balance is created or updated.

```php
final readonly class OpeningBalanceUpdated
{
    public function __construct(
        public int $version,
        public int $openingBalanceId,
        public int $clinicId,
        public ?int $actorId,
        public int $year,
        public int $month,
        public string $amount,
        public CarbonImmutable $occurredAt,
    ) {}
}
```

## Consumer Rules

- Consumers own their consequences.
- Consumers must be idempotent for queued or external side effects.
- A listener may call only services/repositories inside its own module.
- If a consumer needs more data than the payload provides, it must use a public contract or request a payload version change.
