<?php

namespace Modules\ClinicScheduling\Contracts\Public;

use Modules\ClinicScheduling\Data\Public\AppointmentExternalEventDTO;

interface AppointmentUpsertFromExternalSourceInterface
{
    public function upsertFromExternalSource(AppointmentExternalEventDTO $event): int;
}
