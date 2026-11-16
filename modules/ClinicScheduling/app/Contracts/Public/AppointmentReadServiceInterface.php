<?php

namespace Modules\ClinicScheduling\Contracts\Public;

use Modules\ClinicScheduling\Data\Public\AppointmentSnapshotDTO;

interface AppointmentReadServiceInterface
{
    public function getSnapshotById(int $appointmentId): ?AppointmentSnapshotDTO;

    public function findIdByExternalEventId(int $clinicId, int $clinicUserId, string $externalEventId): ?int;

    /**
     * Os atendimentos não cancelados do paciente nesta clínica, do mais recente para o
     * mais antigo, até `$limit`.
     *
     * @return list<AppointmentSnapshotDTO>
     */
    public function listForPatientInClinic(int $clinicId, int $patientId, int $limit = 50): array;

    /**
     * Os atendimentos da clínica com esses ids; id de outra clínica fica de fora.
     *
     * @param  list<int>  $appointmentIds
     * @return array<int, AppointmentSnapshotDTO> indexado pelo id
     */
    public function getSnapshotsByIds(int $clinicId, array $appointmentIds): array;
}
