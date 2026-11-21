<?php

namespace Modules\Email\Contracts;

use Modules\ClinicScheduling\Events\AppointmentReminderDue;

interface AppointmentReminderSenderInterface
{
    public const EMAIL_TYPE = 'appointment_reminder';

    public function send(AppointmentReminderDue $event): void;
}
