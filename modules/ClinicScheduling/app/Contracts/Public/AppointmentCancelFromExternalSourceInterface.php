<?php

namespace Modules\ClinicScheduling\Contracts\Public;

use Carbon\CarbonImmutable;

interface AppointmentCancelFromExternalSourceInterface
{
    public function cancelFromExternalSource(int $appointmentId, int $clinicUserId, CarbonImmutable $occurredAt): void;
}
