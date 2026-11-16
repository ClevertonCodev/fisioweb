<?php

namespace Modules\Admin\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Password;
use Modules\Admin\Models\User;
use Tests\TestCase;

class PasswordChangeRevokesSessionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_revokes_the_tokens_issued_before(): void
    {
        $user  = User::factory()->create();
        $token = auth('admin')->login($user);
        $this->travel(1)->seconds();

        $this->asGuest()->postJson('/api/admin/auth/reset-password', [
            'token'                 => Password::broker('users')->createToken($user),
            'email'                 => $user->email,
            'password'              => 'novaSenha123',
            'password_confirmation' => 'novaSenha123',
        ])->assertOk();

        $this->asBearer($token)->getJson('/api/admin/auth/me')->assertUnauthorized();
        $this->asBearer($token)->postJson('/api/admin/auth/refresh')->assertUnauthorized();
    }

    public function test_token_issued_after_the_reset_keeps_working(): void
    {
        $this->freezeSecond();
        $user = User::factory()->create();
        $user->forceFill(['password' => 'novaSenha123'])->save();

        $token = auth('admin')->login($user);

        $this->asBearer($token)->getJson('/api/admin/auth/me')->assertOk()->assertJsonPath('id', $user->id);
    }

    private function asGuest(): static
    {
        $this->forgetSession();

        return $this->withHeaders(['Authorization' => '']);
    }

    private function asBearer(string $token): static
    {
        $this->forgetSession();

        return $this->withToken($token);
    }

    /** O guard e o JWT da lib guardam o usuário e o token da requisição anterior. */
    private function forgetSession(): void
    {
        $this->app['auth']->forgetGuards();
        $this->app['tymon.jwt']->unsetToken();
    }
}
