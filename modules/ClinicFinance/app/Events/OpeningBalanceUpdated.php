<?php

namespace Modules\ClinicFinance\Events;

use Carbon\CarbonImmutable;

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
