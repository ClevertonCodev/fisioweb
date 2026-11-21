<?php

namespace Modules\ClinicScheduling\Contracts;

use Carbon\CarbonImmutable;

interface AppointmentReminderServiceInterface
{
    /**
     * @return int quantos lembretes foram disparados
     */
    public function dispatchDue(CarbonImmutable $now): int;
}
