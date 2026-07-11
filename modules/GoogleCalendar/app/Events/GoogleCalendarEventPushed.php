<?php

namespace Modules\GoogleCalendar\Events;

use Carbon\CarbonImmutable;

final readonly class GoogleCalendarEventPushed
{
    public function __construct(
        public int $version,
        public int $clinicUserId,
        public int $appointmentId,
        public string $googleEventId,
        public CarbonImmutable $occurredAt,
    ) {}
}
