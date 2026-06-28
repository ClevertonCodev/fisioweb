<?php

namespace Modules\ClinicFinance\Events;

use Carbon\CarbonImmutable;

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
