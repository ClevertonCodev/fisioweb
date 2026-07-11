<?php

namespace Modules\GoogleCalendar\Events;

use Carbon\CarbonImmutable;

final readonly class GoogleCalendarChangesPulled
{
    public function __construct(
        public int $version,
        public int $clinicUserId,
        public int $pulledEventCount,
        public CarbonImmutable $occurredAt,
    ) {}
}
