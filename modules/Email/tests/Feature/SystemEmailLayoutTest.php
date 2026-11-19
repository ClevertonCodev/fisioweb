<?php

namespace Modules\Email\Tests\Feature;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Modules\Clinic\Notifications\VerifyClinicEmailNotification;
use Symfony\Component\Mime\Email;
use Tests\TestCase;

class SystemEmailLayoutTest extends TestCase
{
    public function test_clinic_verification_email_uses_ivs_med_layout(): void
    {
        $html = (string) (new VerifyClinicEmailNotification('https://app.test/clinica/verificar-email?token=abc', 'Clínica Teste'))
            ->toMail(new AnonymousNotifiable)
            ->render();

        $this->assertStringContainsString('src="cid:ivsmed-logo"', $html);
        $this->assertStringContainsString('Este endereço não recebe respostas.', $html);
        $this->assertStringContainsString('Confirmar meu e-mail', $html);
        $this->assertStringContainsString('Este link vale por 24 horas.', $html);
        $this->assertStringNotContainsString('Todos os direitos reservados', $html);
    }

    public function test_reset_password_email_uses_ivs_med_layout_in_portuguese(): void
    {
        app()->setLocale('pt_BR');
        ResetPassword::createUrlUsing(fn (): string => 'https://app.test/clinica/redefinir-senha?token=abc');

        try {
            $html = (string) (new ResetPassword('abc'))->toMail(new AnonymousNotifiable)->render();
        } finally {
            ResetPassword::$createUrlCallback = null;
        }

        $this->assertStringContainsString('src="cid:ivsmed-logo"', $html);
        $this->assertStringContainsString('Redefinir senha', $html);
        $this->assertStringContainsString('expira em 60 minutos', $html);
        $this->assertStringContainsString('https://app.test/clinica/redefinir-senha?token=abc', $html);
        $this->assertStringContainsString('Este endereço não recebe respostas.', $html);
    }

    public function test_sent_email_carries_the_logo_inline(): void
    {
        config(['mail.default' => 'array']);

        Notification::route('mail', 'destino@example.com')
            ->notifyNow(new VerifyClinicEmailNotification('https://app.test/clinica/verificar-email?token=abc', 'Clínica Teste'));

        $sent = app('mailer')->getSymfonyTransport()->messages();
        $this->assertCount(1, $sent);

        /** @var Email $email */
        $email  = $sent[0]->getOriginalMessage();
        $inline = collect($email->getAttachments())
            ->filter(fn ($part) => $part->getDisposition() === 'inline' && $part->getMediaSubtype() === 'png');

        $this->assertCount(1, $inline);
        $this->assertSame([], $email->getReplyTo());

        $raw       = $sent[0]->toString();
        $contentId = $inline->first()->getContentId();
        $this->assertStringContainsString('cid:' . $contentId, quoted_printable_decode($raw));
        $this->assertStringNotContainsString('cid:ivsmed-logo"', quoted_printable_decode($raw));
    }

    public function test_clinic_verification_plain_text_has_the_new_footer(): void
    {
        $mail = (new VerifyClinicEmailNotification('https://app.test/clinica/verificar-email?token=abc', 'Clínica Teste'))
            ->toMail(new AnonymousNotifiable);
        $text = (string) app(\Illuminate\Mail\Markdown::class)->renderText($mail->markdown, $mail->data());

        $this->assertStringContainsString('IVS MED', $text);
        $this->assertStringContainsString('Enviado pela IVS MED. Este endereço não recebe respostas.', $text);
        $this->assertStringNotContainsString('Todos os direitos reservados', $text);
    }
}
