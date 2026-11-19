<?php

namespace Modules\Email\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Modules\Email\Support\ClinicDateFormatter;

class TreatmentPlanSentMail extends Mailable
{
    /**
     * @param  list<array{0: string, 1: string}>  $detailsRows
     */
    public function __construct(
        public readonly string $clinicName,
        public readonly ?string $clinicPhone,
        public readonly ?string $clinicAddress,
        public readonly string $greetingName,
        public readonly string $programTitle,
        public readonly array $detailsRows,
        public readonly ?string $message,
        public readonly ?string $authorName,
        public readonly ?string $authorRole,
        public readonly string $shareUrl,
    ) {}

    public function envelope(): Envelope
    {
        $fromAddress = (string) config('mail.from.address', 'naoresponda@ivsmed.com');
        $safeClinic  = ClinicDateFormatter::singleLine($this->clinicName);

        return new Envelope(
            from: new Address($fromAddress, "{$safeClinic} via IVS MED"),
            subject: "Seu programa de exercícios está disponível · {$safeClinic}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'email::mail.treatment-plan-sent',
        );
    }
}
