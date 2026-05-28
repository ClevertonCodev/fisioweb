<?php

namespace Modules\Admin\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Modules\Admin\Models\User;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    // -----------------------------------------------------------------------
    // forgot-password
    // -----------------------------------------------------------------------

    public function test_sends_reset_link_to_existing_admin_user(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $response = $this->postJson('/api/admin/auth/forgot-password', [
            'email' => $user->email,
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'E-mail de recuperação enviado. Verifique sua caixa de entrada.']);

        $this->assertDatabaseHas('password_reset_tokens', ['email' => $user->email]);
    }

    public function test_forgot_password_returns_400_for_unknown_email(): void
    {
        $response = $this->postJson('/api/admin/auth/forgot-password', [
            'email' => 'notfound@example.com',
        ]);

        $response->assertStatus(400)
            ->assertJson(['message' => 'Não foi possível enviar o e-mail de recuperação.']);
    }

    public function test_forgot_password_requires_email(): void
    {
        $response = $this->postJson('/api/admin/auth/forgot-password', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_forgot_password_validates_email_format(): void
    {
        $response = $this->postJson('/api/admin/auth/forgot-password', [
            'email' => 'not-an-email',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_forgot_password_returns_429_when_throttled(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        // Primeira solicitação gera o token
        $this->postJson('/api/admin/auth/forgot-password', ['email' => $user->email]);

        // Segunda solicitação imediata deve ser bloqueada pelo throttle
        $response = $this->postJson('/api/admin/auth/forgot-password', ['email' => $user->email]);

        $response->assertStatus(429)
            ->assertJson(['message' => 'Aguarde antes de solicitar um novo e-mail de recuperação.']);
    }

    // -----------------------------------------------------------------------
    // reset-password
    // -----------------------------------------------------------------------

    public function test_resets_password_with_valid_token(): void
    {
        $user  = User::factory()->create();
        $token = Password::broker('users')->createToken($user);

        $response = $this->postJson('/api/admin/auth/reset-password', [
            'token'                 => $token,
            'email'                 => $user->email,
            'password'              => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'Senha redefinida com sucesso.']);

        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
    }

    public function test_reset_password_returns_422_for_invalid_token(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/admin/auth/reset-password', [
            'token'                 => 'invalid-token',
            'email'                 => $user->email,
            'password'              => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertUnprocessable()
            ->assertJson(['message' => 'Token inválido ou expirado.']);
    }

    public function test_reset_password_requires_all_fields(): void
    {
        $response = $this->postJson('/api/admin/auth/reset-password', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['token', 'email', 'password', 'password_confirmation']);
    }

    public function test_reset_password_validates_password_confirmation(): void
    {
        $user  = User::factory()->create();
        $token = Password::broker('users')->createToken($user);

        $response = $this->postJson('/api/admin/auth/reset-password', [
            'token'                 => $token,
            'email'                 => $user->email,
            'password'              => 'newpassword123',
            'password_confirmation' => 'differentpassword',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_reset_password_validates_minimum_length(): void
    {
        $user  = User::factory()->create();
        $token = Password::broker('users')->createToken($user);

        $response = $this->postJson('/api/admin/auth/reset-password', [
            'token'                 => $token,
            'email'                 => $user->email,
            'password'              => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }
}
