<?php

namespace Modules\Clinic\Data\Public;

use Carbon\CarbonImmutable;

final readonly class GoogleTokenSetDTO
{
    public function __construct(
        public ?string $accessToken,
        public ?string $refreshToken,
        public ?CarbonImmutable $expiresAt,
        public string $calendarId,
        public ?string $syncToken,
        public CarbonImmutable $connectedAt,
    ) {}
}
