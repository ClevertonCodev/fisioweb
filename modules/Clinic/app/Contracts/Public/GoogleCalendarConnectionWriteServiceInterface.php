<?php

namespace Modules\Clinic\Contracts\Public;

use Modules\Clinic\Data\Public\GoogleTokenSetDTO;

interface GoogleCalendarConnectionWriteServiceInterface
{
    public function storeTokens(int $clinicUserId, GoogleTokenSetDTO $tokens): void;

    public function storeSyncToken(int $clinicUserId, ?string $syncToken): void;

    public function clearTokens(int $clinicUserId): void;
}
