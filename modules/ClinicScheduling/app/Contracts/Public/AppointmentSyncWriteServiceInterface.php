<?php

namespace Modules\ClinicScheduling\Contracts\Public;

use Carbon\CarbonImmutable;

interface AppointmentSyncWriteServiceInterface
{
    public function recordGoogleEventId(int $appointmentId, string $googleEventId, CarbonImmutable $syncedAt): void;
}
