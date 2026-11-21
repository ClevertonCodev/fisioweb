<?php

namespace Modules\Patient\Contracts\Public;

interface PatientReminderPreferenceWriteServiceInterface
{
    /**
     * @return bool `false` quando o paciente não é desta clínica (ou foi excluído)
     */
    public function disableAppointmentReminderEmail(int $clinicId, int $patientId): bool;
}
