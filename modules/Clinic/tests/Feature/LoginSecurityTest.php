<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class LoginSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_user_logs_in(): void
    {
        $user = ClinicUser::factory()->create();

        $this->postJson('/api/clinic/auth/login', [
            'email'    => $user->email,
            'password' => 'password',
        ])->assertOk()->assertJsonStructure(['access_token']);
    }

    public function test_inactive_user_with_right_password_gets_403_without_token(): void
    {
        $user = ClinicUser::factory()->create(['status' => ClinicUser::STATUS_INACTIVE]);

        $this->postJson('/api/clinic/auth/login', [
            'email'    => $user->email,
            'password' => 'password',
        ])
            ->assertForbidden()
            ->assertJson(['message' => 'Seu acesso está desativado. Fale com o administrador da clínica.'])
            ->assertJsonMissingPath('access_token');
    }

    public function test_inactive_user_with_wrong_password_gets_the_usual_401(): void
    {
        $user = ClinicUser::factory()->create(['status' => ClinicUser::STATUS_INACTIVE]);

        $this->postJson('/api/clinic/auth/login', [
            'email'    => $user->email,
            'password' => 'senha-errada',
        ])->assertUnauthorized()->assertJson(['message' => 'Credenciais inválidas.']);
    }

    public function test_login_blocks_the_sixth_attempt_in_a_minute_for_the_same_email(): void
    {
        $user    = ClinicUser::factory()->create();
        $attempt = fn () => $this->postJson('/api/clinic/auth/login', [
            'email'    => $user->email,
            'password' => 'senha-errada',
        ]);

        for ($i = 0; $i < 5; $i++) {
            $attempt()->assertUnauthorized();
        }

        $attempt()
            ->assertStatus(429)
            ->assertJson(['message' => 'Muitas tentativas. Aguarde um minuto e tente de novo.'])
            ->assertHeader('Retry-After');
    }

    /** E-mail que não é texto cai na validação (422), não quebra o limitador. */
    public function test_login_with_email_as_a_list_is_a_validation_error(): void
    {
        $this->postJson('/api/clinic/auth/login', [
            'email'    => ['a@b.c'],
            'password' => 'senha-errada',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email']);
    }

    public function test_login_limit_is_per_email_so_another_account_still_gets_in(): void
    {
        $blocked = ClinicUser::factory()->create();
        $other   = ClinicUser::factory()->create();

        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/clinic/auth/login', [
                'email'    => $blocked->email,
                'password' => 'senha-errada',
            ]);
        }

        $this->postJson('/api/clinic/auth/login', [
            'email'    => $other->email,
            'password' => 'password',
        ])->assertOk();
    }

    /** O IP faz parte da chave: quem só sabe o e-mail não trava o login do dono. */
    public function test_login_limit_is_per_ip_so_the_owner_still_gets_in(): void
    {
        $user = ClinicUser::factory()->create();

        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/clinic/auth/login', [
                'email'    => $user->email,
                'password' => 'senha-errada',
            ]);
        }

        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.2'])
            ->postJson('/api/clinic/auth/login', [
                'email'    => $user->email,
                'password' => 'password',
            ])->assertOk();
    }

    public function test_forgot_password_blocks_the_sixth_call_in_a_minute(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/clinic/auth/forgot-password', [
                'email' => "pessoa{$i}@example.com",
            ])->assertOk();
        }

        $this->postJson('/api/clinic/auth/forgot-password', [
            'email' => 'pessoa5@example.com',
        ])->assertStatus(429);
    }

    public function test_asking_for_links_does_not_use_up_the_reset_attempts(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/clinic/auth/forgot-password', [
                'email' => "pessoa{$i}@example.com",
            ])->assertOk();
        }

        $this->postJson('/api/clinic/auth/reset-password', [
            'token'                 => 'token-invalido',
            'email'                 => 'pessoa@example.com',
            'password'              => 'novaSenha123',
            'password_confirmation' => 'novaSenha123',
        ])->assertStatus(422);
    }

    public function test_reset_password_blocks_the_sixth_call_in_a_minute(): void
    {
        $payload = [
            'token'                 => 'token-invalido',
            'email'                 => 'pessoa@example.com',
            'password'              => 'novaSenha123',
            'password_confirmation' => 'novaSenha123',
        ];

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/clinic/auth/reset-password', $payload)->assertStatus(422);
        }

        $this->postJson('/api/clinic/auth/reset-password', $payload)->assertStatus(429);
    }
}
