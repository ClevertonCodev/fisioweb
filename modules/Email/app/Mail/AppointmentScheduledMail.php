<?php

namespace Modules\Email\Mail;

class AppointmentScheduledMail extends AppointmentMail
{
    protected function subjectLine(): string
    {
        return "Consulta marcada para {$this->subjectDate} às {$this->subjectTime}";
    }

    protected function markdownView(): string
    {
        return 'email::mail.appointment-scheduled';
    }
}
