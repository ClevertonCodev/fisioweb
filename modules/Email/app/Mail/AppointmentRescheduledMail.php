<?php

namespace Modules\Email\Mail;

class AppointmentRescheduledMail extends AppointmentMail
{
    protected function subjectLine(): string
    {
        return "Consulta remarcada para {$this->subjectDate} às {$this->subjectTime}";
    }

    protected function markdownView(): string
    {
        return 'email::mail.appointment-rescheduled';
    }
}
