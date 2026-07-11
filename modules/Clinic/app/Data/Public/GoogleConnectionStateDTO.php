<?php

namespace Modules\Clinic\Data\Public;

use Carbon\CarbonImmutable;

final readonly class GoogleConnectionStateDTO
{
    public function __construct(
        public int $clinicUserId,
        public int $clinicId,
        public bool $connected,
        public ?string $accessToken,
        public ?string $refreshToken,
        public ?CarbonImmutable $tokenExpiresAt,
        public ?string $calendarId,
        public ?string $syncToken,
        public ?CarbonImmutable $connectedAt,
    ) {}
}
