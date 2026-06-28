<?php

namespace Modules\ClinicFinance\Events;

use Carbon\CarbonImmutable;

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
