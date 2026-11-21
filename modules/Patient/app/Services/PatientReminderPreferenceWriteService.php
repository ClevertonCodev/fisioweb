<?php

namespace Modules\Patient\Services;

use Modules\Patient\Contracts\PatientRepositoryInterface;
use Modules\Patient\Contracts\Public\PatientReminderPreferenceWriteServiceInterface;

class PatientReminderPreferenceWriteService implements PatientReminderPreferenceWriteServiceInterface
{
    public function __construct(
        protected PatientRepositoryInterface $repository,
    ) {}

    public function disableAppointmentReminderEmail(int $clinicId, int $patientId): bool
    {
        $patient = $this->repository->findForClinic($clinicId, $patientId);

        if (is_null($patient)) {
            return false;
        }

        if ($patient->receives_appointment_reminder_email) {
            $this->repository->update((int) $patient->id, ['receives_appointment_reminder_email' => false]);
        }

        return true;
    }
}
