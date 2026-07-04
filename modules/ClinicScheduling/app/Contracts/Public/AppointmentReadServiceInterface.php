<?php

namespace Modules\ClinicScheduling\Contracts\Public;

use Modules\ClinicScheduling\Data\Public\AppointmentSnapshotDTO;

interface AppointmentReadServiceInterface
{
    public function getSnapshotById(int $appointmentId): ?AppointmentSnapshotDTO;

    public function findIdByExternalEventId(int $clinicId, string $externalEventId): ?int;
}
