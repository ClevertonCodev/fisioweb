<?php

namespace Modules\Clinic\Tests\Unit\Notifications;

use Illuminate\Notifications\AnonymousNotifiable;
use Modules\Clinic\Notifications\VerifyClinicEmailNotification;
use Tests\TestCase;

class VerifyClinicEmailNotificationTest extends TestCase
{
    private const VERIFICATION_URL = 'https://app.ivsmed.com/clinica/confirmar-email?id=7&hash=abc';

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.name' => 'IVS MED', 'app.locale' => 'pt_BR']);
        app()->setLocale('pt_BR');
    }

    public function test_subject_uses_the_app_name(): void
    {
        $mail = $this->notification()->toMail(new AnonymousNotifiable);

        $this->assertSame('Confirme o e-mail da sua clínica — IVS MED', $mail->subject);
    }

    public function test_default_template_texts_are_in_portuguese(): void
    {
        $html = (string) $this->notification()->toMail(new AnonymousNotifiable)->render();

        $this->assertStringContainsString('Atenciosamente,', $html);
        $this->assertStringContainsString('Se o botão', $html);
        $this->assertStringContainsString('Enviado pela IVS MED. Este endereço não recebe respostas.', $html);
        $this->assertStringNotContainsString('Regards', $html);
        $this->assertStringNotContainsString('having trouble', $html);
        $this->assertStringNotContainsString('All rights reserved', $html);
    }

    public function test_own_content_and_link_stay_the_same(): void
    {
        $html = (string) $this->notification()->toMail(new AnonymousNotifiable)->render();

        $this->assertStringContainsString('Olá!', $html);
        $this->assertStringContainsString('Sua conta para a clínica Clínica Teste foi criada.', $html);
        $this->assertStringContainsString('Confirmar meu e-mail', $html);
        $this->assertStringContainsString(e(self::VERIFICATION_URL), $html);
        $this->assertStringContainsString('Este link vale por 24 horas.', $html);
    }

    private function notification(): VerifyClinicEmailNotification
    {
        return new VerifyClinicEmailNotification(self::VERIFICATION_URL, 'Clínica Teste');
    }

    public function test_clinic_name_with_markdown_is_shown_as_plain_text(): void
    {
        $notification = new VerifyClinicEmailNotification(self::VERIFICATION_URL, '[Confirme aqui](https://evil.test) *urgente* # já');
        $html         = (string) $notification->toMail(new AnonymousNotifiable)->render();

        $this->assertStringNotContainsString('href="https://evil.test"', $html);
        $this->assertStringNotContainsString('<em>', $html);
        $this->assertStringContainsString('[Confirme aqui](https://evil.test) *urgente* # já', html_entity_decode(strip_tags($html)));
    }

    public function test_clinic_name_with_special_characters_reads_the_same_in_html_and_plain_text(): void
    {
        $name = "Fisio <Movimento>! [x](https://evil.test) _Saúde_ & Cia &amp; &#42;\n# Título";
        $mail = (new VerifyClinicEmailNotification(self::VERIFICATION_URL, $name))->toMail(new AnonymousNotifiable);
        $html = (string) $mail->render();
        $text = (string) app(\Illuminate\Mail\Markdown::class)->renderText($mail->markdown, $mail->data());

        $expected = 'Sua conta para a clínica Fisio <Movimento>! [x](https://evil.test) _Saúde_ & Cia &amp; &#42; # Título foi criada.';

        $this->assertStringNotContainsString('href="https://evil.test"', $html);
        $this->assertStringNotContainsString('<h1>Título', $html);
        $this->assertStringContainsString($expected, html_entity_decode(strip_tags($html)));
        $this->assertStringContainsString($expected, $text);
        $this->assertStringNotContainsString('\\', $text);
    }
}
