<?php

namespace Modules\Admin\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\User;
use Tests\TestCase;

class AdminAuthThrottleTest extends TestCase
{
    use RefreshDatabase;

    private const TOO_MANY_MESSAGE = 'Muitas tentativas. Aguarde um minuto e tente de novo.';

    public function test_login_blocks_the_sixth_attempt_in_a_minute_for_the_same_email(): void
    {
        $user    = User::factory()->create();
        $attempt = fn () => $this->postJson('/api/admin/auth/login', [
            'email'    => $user->email,
            'password' => 'senha-errada',
        ]);

        for ($i = 0; $i < 5; $i++) {
            $attempt()->assertUnauthorized();
        }

        $attempt()
            ->assertStatus(429)
            ->assertJson(['message' => self::TOO_MANY_MESSAGE])
            ->assertHeader('Retry-After');
    }

    public function test_the_right_password_before_the_limit_still_logs_in(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 4; $i++) {
            $this->postJson('/api/admin/auth/login', [
                'email'    => $user->email,
                'password' => 'senha-errada',
            ])->assertUnauthorized();
        }

        $this->postJson('/api/admin/auth/login', [
            'email'    => $user->email,
            'password' => 'password',
        ])->assertOk()->assertJsonStructure(['access_token']);
    }

    public function test_login_limit_is_per_email_so_another_account_still_gets_in(): void
    {
        $blocked = User::factory()->create();
        $other   = User::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/admin/auth/login', [
                'email'    => $blocked->email,
                'password' => 'senha-errada',
            ]);
        }
        $this->postJson('/api/admin/auth/login', [
            'email'    => $blocked->email,
            'password' => 'senha-errada',
        ])->assertStatus(429);

        $this->postJson('/api/admin/auth/login', [
            'email'    => $other->email,
            'password' => 'password',
        ])->assertOk();
    }

    /** O IP faz parte da chave: quem só sabe o e-mail não trava o login do dono. */
    public function test_login_limit_is_per_ip_so_the_owner_still_gets_in(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/admin/auth/login', [
                'email'    => $user->email,
                'password' => 'senha-errada',
            ]);
        }
        $this->postJson('/api/admin/auth/login', [
            'email'    => $user->email,
            'password' => 'senha-errada',
        ])->assertStatus(429);

        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.2'])
            ->postJson('/api/admin/auth/login', [
                'email'    => $user->email,
                'password' => 'password',
            ])->assertOk();
    }

    /** As maiúsculas do e-mail não abrem uma conta nova no limitador. */
    public function test_login_limit_ignores_email_case(): void
    {
        $user = User::factory()->create(['email' => 'operador@fisio.test']);

        foreach (['operador@fisio.test', 'Operador@fisio.test', 'OPERADOR@fisio.test', 'operador@Fisio.test', 'operador@FISIO.test'] as $typed) {
            $this->postJson('/api/admin/auth/login', ['email' => $typed, 'password' => 'senha-errada']);
        }

        $this->postJson('/api/admin/auth/login', [
            'email'    => 'Operador@Fisio.Test',
            'password' => 'senha-errada',
        ])->assertStatus(429);
    }

    /** E-mail que não é texto cai na validação (422), não quebra o limitador. */
    public function test_login_with_email_as_a_list_is_a_validation_error(): void
    {
        $this->postJson('/api/admin/auth/login', [
            'email'    => ['a@b.c'],
            'password' => 'senha-errada',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email']);
    }

    public function test_forgot_password_blocks_the_sixth_call_in_a_minute(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/admin/auth/forgot-password', [
                'email' => "pessoa{$i}@example.com",
            ])->assertOk();
        }

        $this->postJson('/api/admin/auth/forgot-password', [
            'email' => 'pessoa5@example.com',
        ])
            ->assertStatus(429)
            ->assertJson(['message' => self::TOO_MANY_MESSAGE])
            ->assertHeader('Retry-After');
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
            $this->postJson('/api/admin/auth/reset-password', $payload)->assertStatus(422);
        }

        $this->postJson('/api/admin/auth/reset-password', $payload)
            ->assertStatus(429)
            ->assertJson(['message' => self::TOO_MANY_MESSAGE])
            ->assertHeader('Retry-After');
    }

    public function test_asking_for_links_does_not_use_up_the_reset_attempts(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/admin/auth/forgot-password', [
                'email' => "pessoa{$i}@example.com",
            ])->assertOk();
        }

        $this->postJson('/api/admin/auth/reset-password', [
            'token'                 => 'token-invalido',
            'email'                 => 'pessoa@example.com',
            'password'              => 'novaSenha123',
            'password_confirmation' => 'novaSenha123',
        ])->assertStatus(422);
    }
}
