<?php

namespace Modules\Email\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Modules\Email\Support\ClinicDateFormatter;

class AppointmentScheduledMail extends Mailable
{
    /**
     * @param  list<array{0: string, 1: string}>  $detailsRows
     */
    public function __construct(
        public readonly string $clinicName,
        public readonly ?string $clinicPhone,
        public readonly ?string $clinicAddress,
        public readonly string $greetingName,
        public readonly string $subjectDate,
        public readonly string $subjectTime,
        public readonly array $detailsRows,
        public readonly ?string $mapsUrl,
    ) {}

    public function envelope(): Envelope
    {
        $fromAddress = (string) config('mail.from.address', 'naoresponda@ivsmed.com');
        $safeClinic  = ClinicDateFormatter::singleLine($this->clinicName);

        return new Envelope(
            from: new Address($fromAddress, "{$safeClinic} via IVS MED"),
            subject: "Consulta marcada para {$this->subjectDate} às {$this->subjectTime} · {$safeClinic}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'email::mail.appointment-scheduled',
        );
    }
}
