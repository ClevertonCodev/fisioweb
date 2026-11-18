<?php

namespace Tests\Unit\Mail;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\AnonymousNotifiable;
use Tests\TestCase;

class ResetPasswordEmailTranslationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['app.name' => 'IVS MED', 'app.locale' => 'pt_BR']);
        app()->setLocale('pt_BR');
        ResetPassword::createUrlUsing(fn (): string => 'https://app.ivsmed.com/clinica/redefinir-senha?token=abc');
    }

    protected function tearDown(): void
    {
        ResetPassword::$createUrlCallback = null;

        parent::tearDown();
    }

    public function test_reset_password_email_is_fully_in_portuguese(): void
    {
        $mail = (new ResetPassword('abc'))->toMail(new AnonymousNotifiable);
        $html = (string) $mail->render();

        $this->assertSame('Redefinição de senha', $mail->subject);
        $this->assertStringContainsString('Você está recebendo este e-mail porque recebemos um pedido para redefinir a senha da sua conta.', $html);
        $this->assertStringContainsString('Redefinir senha', $html);
        $this->assertStringContainsString('Este link para redefinir a senha expira em 60 minutos.', $html);
        $this->assertStringContainsString('Se você não pediu para redefinir a senha, não precisa fazer nada.', $html);
        $this->assertStringContainsString('Olá!', $html);
        $this->assertStringContainsString('Atenciosamente,', $html);

        foreach (['Hello', 'Reset Password', 'You are receiving', 'will expire in', 'If you did not', 'Regards', 'having trouble', 'All rights reserved'] as $english) {
            $this->assertStringNotContainsString($english, $html);
        }
    }
}
