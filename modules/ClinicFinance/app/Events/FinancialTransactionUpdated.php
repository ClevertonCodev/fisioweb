<?php

namespace Modules\ClinicFinance\Events;

use Carbon\CarbonImmutable;

final readonly class FinancialTransactionUpdated
{
    /**
     * @param  array<int, string>  $changedFields
     */
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
