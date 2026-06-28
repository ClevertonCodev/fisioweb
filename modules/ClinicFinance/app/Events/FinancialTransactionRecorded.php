<?php

namespace Modules\ClinicFinance\Events;

use Carbon\CarbonImmutable;

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
