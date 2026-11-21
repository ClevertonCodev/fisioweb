<?php

namespace Modules\Email\Mail;

class AppointmentCancelledMail extends AppointmentMail
{
    protected function subjectLine(): string
    {
        return "Consulta de {$this->subjectDate} cancelada";
    }

    protected function markdownView(): string
    {
        return 'email::mail.appointment-cancelled';
    }
}
