<?php

namespace Modules\Patient\Services;

use Modules\Patient\Contracts\PatientRepositoryInterface;
use Modules\Patient\Contracts\Public\PatientContactReadServiceInterface;
use Modules\Patient\Data\Public\PatientContactDTO;
use Modules\Patient\Models\Patient;

class PatientContactReadService implements PatientContactReadServiceInterface
{
    public function __construct(
        protected PatientRepositoryInterface $repository,
    ) {}

    public function findById(int $clinicId, int $patientId): ?PatientContactDTO
    {
        $patient = $this->repository->findForClinic($clinicId, $patientId);

        if (is_null($patient)) {
            return null;
        }

        return new PatientContactDTO(
            id: (int) $patient->id,
            clinicId: (int) $patient->clinic_id,
            name: (string) $patient->name,
            apelido: $this->nullableTrim($patient->apelido),
            useApelido: (bool) $patient->use_apelido,
            email: $this->nullableTrim($patient->email),
            phone: $this->nullableTrim($patient->phone),
            receivesAppointmentReminderEmail: (bool) $patient->receives_appointment_reminder_email,
            active: (bool) $patient->is_active && !in_array($patient->status, Patient::INACTIVE_STATUSES, true),
        );
    }

    private function nullableTrim(?string $value): ?string
    {
        if (is_null($value)) {
            return null;
        }

        $trimmed = trim($value);

        return empty($trimmed) ? null : $trimmed;
    }
}
