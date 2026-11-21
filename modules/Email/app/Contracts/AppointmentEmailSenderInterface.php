<?php

namespace Modules\Email\Contracts;

use Modules\ClinicScheduling\Events\AppointmentEmailRequested;

interface AppointmentEmailSenderInterface
{
    public const EMAIL_TYPE_PREFIX = 'appointment_';

    public function send(AppointmentEmailRequested $event): void;
}
