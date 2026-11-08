<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Password;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class PasswordChangeRevokesSessionsTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $master;

    private ClinicUser $physio;

    protected function setUp(): void
    {
        parent::setUp();

        $clinic       = Clinic::factory()->create();
        $this->master = ClinicUser::where('clinic_id', $clinic->id)->where('mestre', ClinicUser::MESTRE_YES)->firstOrFail();
        $this->physio = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
            'mestre'    => ClinicUser::MESTRE_NO,
            'status'    => ClinicUser::STATUS_ACTIVE,
        ]);
    }

    public function test_reset_revokes_the_tokens_issued_before(): void
    {
        $token = $this->tokenFor($this->physio);
        $this->travel(1)->seconds();

        $this->asGuest()->postJson('/api/clinic/auth/reset-password', [
            'token'                 => Password::broker('clinic_users')->createToken($this->physio),
            'email'                 => $this->physio->email,
            'password'              => 'novaSenha123',
            'password_confirmation' => 'novaSenha123',
        ])->assertOk();

        $this->asBearer($token)->getJson('/api/clinic/auth/me')->assertUnauthorized();
        $this->asBearer($token)->postJson('/api/clinic/auth/refresh')->assertUnauthorized();
    }

    public function test_admin_changing_someone_else_password_revokes_only_that_person_sessions(): void
    {
        $physioToken = $this->tokenFor($this->physio);
        $masterToken = $this->tokenFor($this->master);
        $this->travel(1)->seconds();

        $response = $this->asBearer($masterToken)
            ->putJson("/api/clinic/users/{$this->physio->id}", ['password' => 'novaSenha123'])
            ->assertOk();

        $this->assertArrayNotHasKey('access_token', $response->json());
        $this->asBearer($physioToken)->getJson('/api/clinic/auth/me')->assertUnauthorized();
        $this->asBearer($masterToken)->getJson('/api/clinic/auth/me')->assertOk();
    }

    public function test_changing_own_password_returns_a_new_token_and_revokes_the_old_one(): void
    {
        $oldToken = $this->tokenFor($this->physio);
        $this->travel(1)->seconds();

        $newToken = $this->asBearer($oldToken)
            ->putJson("/api/clinic/users/{$this->physio->id}", ['password' => 'novaSenha123'])
            ->assertOk()
            ->assertJsonPath('data.id', $this->physio->id)
            ->json('access_token');

        $this->assertIsString($newToken);
        $this->assertNotSame($oldToken, $newToken);
        $this->asBearer($newToken)->getJson('/api/clinic/auth/me')->assertOk()->assertJsonPath('id', $this->physio->id);
        $this->asBearer($oldToken)->getJson('/api/clinic/auth/me')->assertUnauthorized();
    }

    public function test_old_token_dies_even_when_the_change_happens_in_the_same_second(): void
    {
        $this->freezeSecond();
        $oldToken = $this->tokenFor($this->physio);

        $newToken = $this->asBearer($oldToken)
            ->putJson("/api/clinic/users/{$this->physio->id}", ['password' => 'novaSenha123'])
            ->assertOk()
            ->json('access_token');

        $this->asBearer($oldToken)->getJson('/api/clinic/auth/me')->assertUnauthorized();
        $this->asBearer($newToken)->getJson('/api/clinic/auth/me')->assertOk();
    }

    public function test_editing_without_password_keeps_the_session_and_returns_no_token(): void
    {
        $token = $this->tokenFor($this->physio);
        $this->travel(1)->seconds();

        $response = $this->asBearer($token)
            ->putJson("/api/clinic/users/{$this->physio->id}", ['name' => 'Outro Nome'])
            ->assertOk();

        $this->assertArrayNotHasKey('access_token', $response->json());
        $this->assertNull($this->physio->fresh()->password_changed_at);
        $this->asBearer($token)->getJson('/api/clinic/auth/me')->assertOk();
    }

    public function test_other_clinic_sessions_are_not_affected(): void
    {
        $otherClinic   = Clinic::factory()->create();
        $outsider      = ClinicUser::where('clinic_id', $otherClinic->id)->where('mestre', ClinicUser::MESTRE_YES)->firstOrFail();
        $outsiderToken = $this->tokenFor($outsider);
        $masterToken   = $this->tokenFor($this->master);
        $this->travel(1)->seconds();

        $this->asBearer($masterToken)
            ->putJson("/api/clinic/users/{$this->physio->id}", ['password' => 'novaSenha123'])
            ->assertOk();
        $this->asBearer($masterToken)
            ->putJson("/api/clinic/users/{$outsider->id}", ['password' => 'novaSenha123'])
            ->assertNotFound();

        $this->assertNull($outsider->fresh()->password_changed_at);
        $this->asBearer($outsiderToken)->getJson('/api/clinic/auth/me')->assertOk()->assertJsonPath('id', $outsider->id);
    }

    private function tokenFor(ClinicUser $user): string
    {
        $token = auth('clinic')->login($user);
        $this->app['auth']->forgetGuards();

        return $token;
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
