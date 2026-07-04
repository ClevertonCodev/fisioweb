<?php

namespace Modules\GoogleCalendar\Events;

use Carbon\CarbonImmutable;

final readonly class GoogleCalendarEventDeleted
{
    public function __construct(
        public int $version,
        public int $clinicUserId,
        public string $googleEventId,
        public CarbonImmutable $occurredAt,
    ) {}
}
