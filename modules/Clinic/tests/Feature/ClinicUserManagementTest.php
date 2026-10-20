<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class ClinicUserManagementTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $master;

    protected function setUp(): void
    {
        parent::setUp();

        // O ClinicObserver cria o mestre junto com a clínica.
        $this->clinic = Clinic::factory()->create();
        $this->master = $this->masterOf($this->clinic);
    }

    public function test_index_includes_two_factor_and_google_timestamps(): void
    {
        $connectedAt = now()->subDay()->startOfSecond();
        $withSignals = $this->makeUser(['role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $withSignals->forceFill([
            'two_factor_confirmed_at' => $connectedAt,
            'google_connected_at'     => $connectedAt,
            'two_factor_secret'       => 'segredo-que-nao-sai',
            'google_refresh_token'    => 'token-que-nao-sai',
        ])->save();
        $withoutSignals = $this->makeUser(['role' => ClinicUser::ROLE_SECRETARY]);

        $response = $this->actingAs($this->master, 'clinic')
            ->getJson('/api/clinic/users')
            ->assertOk();

        $items = collect($response->json('data'))->keyBy('id');

        $this->assertNotNull($items[$withSignals->id]['two_factor_confirmed_at']);
        $this->assertNotNull($items[$withSignals->id]['google_connected_at']);
        $this->assertArrayHasKey('two_factor_confirmed_at', $items[$withoutSignals->id]);
        $this->assertNull($items[$withoutSignals->id]['two_factor_confirmed_at']);
        $this->assertArrayHasKey('google_connected_at', $items[$withoutSignals->id]);
        $this->assertNull($items[$withoutSignals->id]['google_connected_at']);
        $response->assertDontSee('segredo-que-nao-sai');
        $response->assertDontSee('token-que-nao-sai');
        foreach ($items as $item) {
            $this->assertArrayNotHasKey('two_factor_secret', $item);
            $this->assertArrayNotHasKey('google_refresh_token', $item);
        }
    }

    public function test_index_is_forbidden_for_physiotherapist_and_secretary(): void
    {
        foreach ([ClinicUser::ROLE_PHYSIOTHERAPIST, ClinicUser::ROLE_SECRETARY] as $role) {
            $this->actingAs($this->makeUser(['role' => $role]), 'clinic')
                ->getJson('/api/clinic/users')
                ->assertForbidden();
        }
    }

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/clinic/users')->assertUnauthorized();
    }

    public function test_update_with_only_role_changes_the_role(): void
    {
        $physio = $this->makeUser(['role' => ClinicUser::ROLE_PHYSIOTHERAPIST, 'document' => '11144477735']);

        $this->actingAs($this->master, 'clinic')
            ->putJson("/api/clinic/users/{$physio->id}", ['role' => ClinicUser::ROLE_SECRETARY])
            ->assertOk()
            ->assertJsonPath('data.role', ClinicUser::ROLE_SECRETARY);

        $this->assertDatabaseHas('clinic_users', [
            'id'       => $physio->id,
            'role'     => ClinicUser::ROLE_SECRETARY,
            'document' => '11144477735',
        ]);
    }

    public function test_update_with_only_status_deactivates_the_user(): void
    {
        $physio = $this->makeUser(['role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);

        $this->actingAs($this->master, 'clinic')
            ->putJson("/api/clinic/users/{$physio->id}", ['status' => false])
            ->assertOk()
            ->assertJsonPath('data.status', ClinicUser::STATUS_INACTIVE);

        $this->assertDatabaseHas('clinic_users', ['id' => $physio->id, 'status' => ClinicUser::STATUS_INACTIVE]);
    }

    public function test_master_cannot_be_demoted_deactivated_or_deleted(): void
    {
        // Com outro admin ativo, a recusa vem da regra do mestre, não do último admin.
        $otherAdmin = $this->makeUser();

        $this->actingAs($otherAdmin, 'clinic')
            ->putJson("/api/clinic/users/{$this->master->id}", ['role' => ClinicUser::ROLE_PHYSIOTHERAPIST])
            ->assertStatus(422);
        $this->actingAs($otherAdmin, 'clinic')
            ->putJson("/api/clinic/users/{$this->master->id}", ['status' => false])
            ->assertStatus(422);
        $this->actingAs($otherAdmin, 'clinic')
            ->deleteJson("/api/clinic/users/{$this->master->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('clinic_users', [
            'id'         => $this->master->id,
            'role'       => ClinicUser::ROLE_ADMIN,
            'status'     => ClinicUser::STATUS_ACTIVE,
            'deleted_at' => null,
        ]);
    }

    public function test_last_active_admin_cannot_be_demoted_deactivated_or_deleted(): void
    {
        // Clínica legada sem mestre: um admin ativo e um admin já inativo (que não conta).
        $clinic = Clinic::factory()->create();
        $this->masterOf($clinic)->delete();
        $lastActive = $this->makeUser(['clinic_id' => $clinic->id]);
        $this->makeUser(['clinic_id' => $clinic->id, 'status' => ClinicUser::STATUS_INACTIVE]);
        $this->makeUser(['clinic_id' => $clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);

        $this->actingAs($lastActive, 'clinic')
            ->putJson("/api/clinic/users/{$lastActive->id}", ['role' => ClinicUser::ROLE_SECRETARY])
            ->assertStatus(422);
        $this->actingAs($lastActive, 'clinic')
            ->putJson("/api/clinic/users/{$lastActive->id}", ['status' => false])
            ->assertStatus(422);
        $this->actingAs($lastActive, 'clinic')
            ->deleteJson("/api/clinic/users/{$lastActive->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('clinic_users', [
            'id'         => $lastActive->id,
            'role'       => ClinicUser::ROLE_ADMIN,
            'status'     => ClinicUser::STATUS_ACTIVE,
            'deleted_at' => null,
        ]);
    }

    public function test_with_two_active_admins_one_can_be_demoted_or_deactivated(): void
    {
        $demoted     = $this->makeUser();
        $deactivated = $this->makeUser();

        $this->actingAs($this->master, 'clinic')
            ->putJson("/api/clinic/users/{$demoted->id}", ['role' => ClinicUser::ROLE_PHYSIOTHERAPIST])
            ->assertOk();
        $this->actingAs($this->master, 'clinic')
            ->putJson("/api/clinic/users/{$deactivated->id}", ['status' => 0])
            ->assertOk();

        $this->assertDatabaseHas('clinic_users', ['id' => $demoted->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->assertDatabaseHas('clinic_users', ['id' => $deactivated->id, 'status' => ClinicUser::STATUS_INACTIVE]);
    }

    public function test_reactivating_or_keeping_admin_role_of_last_active_admin_is_allowed(): void
    {
        $clinic = Clinic::factory()->create();
        $this->masterOf($clinic)->delete();
        $lastActive = $this->makeUser(['clinic_id' => $clinic->id]);

        $this->actingAs($lastActive, 'clinic')
            ->putJson("/api/clinic/users/{$lastActive->id}", ['role' => ClinicUser::ROLE_ADMIN, 'status' => true])
            ->assertOk();
    }

    public function test_non_admin_editing_themselves_cannot_change_role_or_status(): void
    {
        foreach ([ClinicUser::ROLE_PHYSIOTHERAPIST, ClinicUser::ROLE_SECRETARY] as $role) {
            $self = $this->makeUser(['role' => $role]);

            $this->actingAs($self, 'clinic')
                ->putJson("/api/clinic/users/{$self->id}", [
                    'name'   => "Novo nome {$role}",
                    'role'   => ClinicUser::ROLE_ADMIN,
                    'status' => false,
                ])
                ->assertOk();

            $this->assertDatabaseHas('clinic_users', [
                'id'     => $self->id,
                'name'   => "Novo nome {$role}",
                'role'   => $role,
                'status' => ClinicUser::STATUS_ACTIVE,
            ]);
        }
    }

    public function test_non_admin_cannot_edit_someone_else(): void
    {
        $physio = $this->makeUser(['role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $other  = $this->makeUser(['role' => ClinicUser::ROLE_SECRETARY, 'name' => 'Nome Original']);

        $this->actingAs($physio, 'clinic')
            ->putJson("/api/clinic/users/{$other->id}", ['name' => 'Alterado'])
            ->assertForbidden();

        $this->assertDatabaseHas('clinic_users', ['id' => $other->id, 'name' => 'Nome Original']);
    }

    public function test_legacy_inactive_master_can_still_be_edited(): void
    {
        // Dado legado: mestre já inativo. A tela de edição v1 manda o status atual.
        $this->master->forceFill(['status' => ClinicUser::STATUS_INACTIVE])->save();
        $otherAdmin = $this->makeUser();

        $this->actingAs($otherAdmin, 'clinic')
            ->putJson("/api/clinic/users/{$this->master->id}", [
                'name'   => 'Mestre Renomeado',
                'role'   => ClinicUser::ROLE_ADMIN,
                'status' => ClinicUser::STATUS_INACTIVE,
            ])
            ->assertOk();

        $this->assertDatabaseHas('clinic_users', ['id' => $this->master->id, 'name' => 'Mestre Renomeado']);
    }

    public function test_admin_can_be_deleted_when_another_admin_is_active(): void
    {
        $admin = $this->makeUser();

        $this->actingAs($this->master, 'clinic')
            ->deleteJson("/api/clinic/users/{$admin->id}")
            ->assertOk();

        $this->assertSoftDeleted('clinic_users', ['id' => $admin->id]);
    }

    public function test_inactive_admin_can_be_deleted_even_with_a_single_active_admin(): void
    {
        // Clínica legada sem mestre: só um admin ativo; o inativo não conta.
        $clinic = Clinic::factory()->create();
        $this->masterOf($clinic)->delete();
        $lastActive = $this->makeUser(['clinic_id' => $clinic->id]);
        $inactive   = $this->makeUser(['clinic_id' => $clinic->id, 'status' => ClinicUser::STATUS_INACTIVE]);

        $this->actingAs($lastActive, 'clinic')
            ->deleteJson("/api/clinic/users/{$inactive->id}")
            ->assertOk();

        $this->assertSoftDeleted('clinic_users', ['id' => $inactive->id]);
    }

    private function masterOf(Clinic $clinic): ClinicUser
    {
        return ClinicUser::where('clinic_id', $clinic->id)
            ->where('mestre', ClinicUser::MESTRE_YES)
            ->firstOrFail();
    }

    private function makeUser(array $attributes = []): ClinicUser
    {
        return ClinicUser::factory()->create(array_merge([
            'clinic_id' => $this->clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
            'mestre'    => ClinicUser::MESTRE_NO,
            'status'    => ClinicUser::STATUS_ACTIVE,
        ], $attributes));
    }
}
