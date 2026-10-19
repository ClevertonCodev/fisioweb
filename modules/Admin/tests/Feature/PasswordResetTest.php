<?php

namespace Modules\Admin\Tests\Feature;

use Illuminate\Auth\Notifications\ResetPassword;
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
            ->assertJson(['message' => 'Se houver uma conta com este e-mail, enviamos um link para criar uma senha nova.']);

        $this->assertDatabaseHas('password_reset_tokens', ['email' => $user->email]);
    }

    /** Sem conta, a resposta é a mesma: não revela quem tem acesso. */
    public function test_forgot_password_answers_the_same_for_unknown_email(): void
    {
        $response = $this->postJson('/api/admin/auth/forgot-password', [
            'email' => 'notfound@example.com',
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'Se houver uma conta com este e-mail, enviamos um link para criar uma senha nova.']);

        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'notfound@example.com']);
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

    /**
     * O broker segura um novo pedido por 60 s só para quem tem conta; a
     * resposta continua a mesma para não revelar a conta, e nada é reenviado.
     */
    public function test_forgot_password_answers_the_same_when_the_broker_throttles(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->postJson('/api/admin/auth/forgot-password', ['email' => $user->email]);

        $response = $this->postJson('/api/admin/auth/forgot-password', ['email' => $user->email]);

        $response->assertOk()
            ->assertJson(['message' => 'Se houver uma conta com este e-mail, enviamos um link para criar uma senha nova.']);

        Notification::assertSentToTimes($user, ResetPassword::class, 1);
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
            ->assertJson(['message' => 'Link inválido ou expirado. Peça um novo link.']);
    }

    /**
     * Token errado com e-mail sem conta responde igual a token errado com
     * e-mail que tem conta: a rota não revela quem tem acesso.
     */
    public function test_reset_password_answers_the_same_with_or_without_an_account(): void
    {
        $user    = User::factory()->create();
        $payload = fn (string $email) => [
            'token'                 => 'invalid-token',
            'email'                 => $email,
            'password'              => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ];

        $withAccount    = $this->postJson('/api/admin/auth/reset-password', $payload($user->email));
        $withoutAccount = $this->postJson('/api/admin/auth/reset-password', $payload('ninguem@example.com'));

        $withAccount->assertUnprocessable();
        $withoutAccount->assertUnprocessable();
        $this->assertSame($withAccount->json(), $withoutAccount->json());
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
