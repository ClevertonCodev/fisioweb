<?php

namespace Modules\Email\Services;

use Modules\Email\Contracts\ReminderUnsubscribeServiceInterface;
use Modules\Email\Support\ReminderUnsubscribeLink;
use Modules\Patient\Contracts\Public\PatientReminderPreferenceWriteServiceInterface;

class ReminderUnsubscribeService implements ReminderUnsubscribeServiceInterface
{
    public function __construct(
        protected PatientReminderPreferenceWriteServiceInterface $patients,
    ) {}

    public function unsubscribe(string $token): bool
    {
        $ids = ReminderUnsubscribeLink::parse($token);

        if (is_null($ids) || !$this->patients->disableAppointmentReminderEmail($ids['clinicId'], $ids['patientId'])) {
            return false;
        }

        logInfo('Lembretes de consulta desligados pelo paciente', [
            'type'       => 'appointment_reminder_unsubscribe',
            'clinic_id'  => $ids['clinicId'],
            'patient_id' => $ids['patientId'],
        ]);

        return true;
    }
}
