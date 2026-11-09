<?php

namespace Modules\Admin\Contracts\Public;

use DateTimeInterface;

final readonly class RecentLoginAs
{
    public function __construct(
        public string $operatorName,
        public int $clinicUserId,
        public DateTimeInterface $createdAt,
    ) {}
}
