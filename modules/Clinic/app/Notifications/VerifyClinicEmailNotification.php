<?php

namespace Modules\Clinic\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\HtmlString;

class VerifyClinicEmailNotification extends Notification
{
    public function __construct(
        public readonly string $verificationUrl,
        public readonly string $clinicName,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Confirme o e-mail da sua clínica — ' . config('app.name'))
            ->markdown('notifications::email', [
                'badge' => 'Confirmação de e-mail',
                'title' => 'Confirme o e-mail da sua clínica',
            ])
            ->greeting('Olá!')
            ->line(new HtmlString('Sua conta para a clínica ' . markdownLiteral($this->clinicName)->toHtml() . ' foi criada.'))
            ->line('Confirme seu e-mail pelo botão abaixo para liberar o acesso ao painel.')
            ->action('Confirmar meu e-mail', $this->verificationUrl)
            ->line('Este link vale por 24 horas. Se você não criou esta conta, pode ignorar este e-mail.');
    }
}
