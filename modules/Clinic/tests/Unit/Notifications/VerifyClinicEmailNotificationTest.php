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
        $this->assertStringContainsString('Todos os direitos reservados.', $html);
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
}
