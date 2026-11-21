<?php

namespace Modules\Email\Mail;

class AppointmentReminderMail extends AppointmentMail
{
    /**
     * @param  list<array{0: string, 1: string}>  $detailsRows
     */
    public function __construct(
        string $clinicName,
        ?string $clinicPhone,
        ?string $clinicAddress,
        string $greetingName,
        string $subjectDate,
        string $subjectTime,
        array $detailsRows,
        ?string $mapsUrl,
        public readonly string $dayWord,
        public readonly string $unsubscribeUrl,
    ) {
        parent::__construct(
            clinicName: $clinicName,
            clinicPhone: $clinicPhone,
            clinicAddress: $clinicAddress,
            greetingName: $greetingName,
            subjectDate: $subjectDate,
            subjectTime: $subjectTime,
            detailsRows: $detailsRows,
            mapsUrl: $mapsUrl,
        );
    }

    protected function subjectLine(): string
    {
        return "Lembrete: consulta {$this->dayWord} às {$this->subjectTime}";
    }

    protected function markdownView(): string
    {
        return 'email::mail.appointment-reminder';
    }
}
