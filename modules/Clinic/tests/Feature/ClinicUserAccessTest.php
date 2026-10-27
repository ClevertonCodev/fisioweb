<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Contracts\Public\ClinicUserGoogleConnectionReadServiceInterface;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

/**
 * Desativar corta a sessão que já estava aberta: o token emitido antes deixa
 * de valer em toda rota autenticada da clínica, inclusive no refresh.
 */
class ClinicUserAccessTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $master;

    protected function setUp(): void
    {
        parent::setUp();

        $clinic       = Clinic::factory()->create();
        $this->master = ClinicUser::where('clinic_id', $clinic->id)
            ->where('mestre', ClinicUser::MESTRE_YES)
            ->firstOrFail();
    }

    public function test_token_issued_before_deactivation_stops_working(): void
    {
        $admin = $this->makeUser(['role' => ClinicUser::ROLE_ADMIN]);
        $token = $this->tokenFor($admin);

        $this->actingAs($this->master, 'clinic')
            ->putJson("/api/clinic/users/{$admin->id}", ['status' => false])
            ->assertOk();

        $this->asBearer($token)->getJson('/api/clinic/users')->assertUnauthorized();
        $this->asBearer($token)->postJson('/api/clinic/auth/refresh')->assertUnauthorized();
        $this->asBearer($token)
            ->putJson("/api/clinic/users/{$admin->id}", ['status' => true])
            ->assertUnauthorized();

        $this->assertDatabaseHas('clinic_users', ['id' => $admin->id, 'status' => ClinicUser::STATUS_INACTIVE]);
    }

    public function test_deactivating_disconnects_google_calendar(): void
    {
        $physio = $this->makeUser();
        $physio->forceFill([
            'google_access_token'  => 'token-de-acesso',
            'google_refresh_token' => 'token-de-refresh',
            'google_calendar_id'   => 'agenda-pessoal',
            'google_connected_at'  => now(),
        ])->save();
        $google = app(ClinicUserGoogleConnectionReadServiceInterface::class);
        $this->assertContains($physio->id, $google->connectedClinicUserIds());

        $this->actingAs($this->master, 'clinic')
            ->putJson("/api/clinic/users/{$physio->id}", ['status' => false])
            ->assertOk();

        // Sem credencial, o pull e o push do Google param para quem foi desativado.
        $this->assertNotContains($physio->id, $google->connectedClinicUserIds());
        $this->assertFalse($google->isConnected($physio->id));
        $row = $physio->fresh();
        $this->assertNull($row->google_access_token);
        $this->assertNull($row->google_refresh_token);
        $this->assertNull($row->google_calendar_id);
    }

    public function test_editing_an_active_user_keeps_google_connected(): void
    {
        $physio = $this->makeUser();
        $physio->forceFill(['google_refresh_token' => 'token', 'google_connected_at' => now()])->save();

        $this->actingAs($this->master, 'clinic')
            ->putJson("/api/clinic/users/{$physio->id}", ['name' => 'Outro nome', 'status' => true])
            ->assertOk();

        $this->assertTrue(app(ClinicUserGoogleConnectionReadServiceInterface::class)->isConnected($physio->id));
    }

    public function test_token_of_active_user_keeps_working(): void
    {
        $token = $this->tokenFor($this->master);

        $this->asBearer($token)->getJson('/api/clinic/users')->assertOk();
    }

    public function test_inactive_admin_is_not_released_by_gate_before(): void
    {
        $inactiveAdmin = $this->makeUser([
            'role'   => ClinicUser::ROLE_ADMIN,
            'status' => ClinicUser::STATUS_INACTIVE,
        ]);

        // actingAs não passa pelo provider: sobra o Gate::before.
        $this->actingAs($inactiveAdmin, 'clinic')
            ->getJson('/api/clinic/users')
            ->assertForbidden();
    }

    private function makeUser(array $attributes = []): ClinicUser
    {
        return ClinicUser::factory()->create(array_merge([
            'clinic_id' => $this->master->clinic_id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
            'mestre'    => ClinicUser::MESTRE_NO,
            'status'    => ClinicUser::STATUS_ACTIVE,
        ], $attributes));
    }

    private function tokenFor(ClinicUser $user): string
    {
        return auth('clinic')->login($user);
    }

    /** Requisição só com o token, sem o usuário guardado no guard por actingAs. */
    private function asBearer(string $token): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($token);
    }
}
