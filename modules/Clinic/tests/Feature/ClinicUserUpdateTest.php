<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class ClinicUserUpdateTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $master;

    private ClinicUser $admin;

    private ClinicUser $physio;

    protected function setUp(): void
    {
        parent::setUp();

        $clinic = Clinic::factory()->create();

        $this->master = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'mestre'    => ClinicUser::MESTRE_YES,
            'status'    => ClinicUser::STATUS_ACTIVE,
        ]);
        $this->admin  = ClinicUser::factory()->create(['clinic_id' => $clinic->id]);
        $this->physio = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
            'status'    => ClinicUser::STATUS_ACTIVE,
        ]);
    }

    public function test_master_cannot_be_deactivated(): void
    {
        $this->actingAs($this->admin, 'clinic')
            ->putJson("/api/clinic/users/{$this->master->id}", [
                'name'     => $this->master->name,
                'document' => '11144477735',
                'status'   => 0,
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'O usuário mestre da clínica não pode ser desativado.');

        $this->assertSame(ClinicUser::STATUS_ACTIVE, (int) $this->master->fresh()->status);
    }

    public function test_master_stays_active_when_saved_with_status_active(): void
    {
        $this->actingAs($this->admin, 'clinic')
            ->putJson("/api/clinic/users/{$this->master->id}", [
                'name'     => 'Mestre Renomeado',
                'document' => '11144477735',
                'status'   => 1,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Mestre Renomeado');
    }

    public function test_inactive_master_is_reactivated_when_saved_as_active(): void
    {
        // A v1 deixava desativar o mestre; salvar como ativo tem de passar.
        $this->master->forceFill(['status' => ClinicUser::STATUS_INACTIVE])->save();

        $this->actingAs($this->admin, 'clinic')
            ->putJson("/api/clinic/users/{$this->master->id}", [
                'name'     => 'Mestre Reativado',
                'document' => '11144477735',
                'status'   => 1,
            ])
            ->assertOk();

        $this->assertSame(ClinicUser::STATUS_ACTIVE, (int) $this->master->fresh()->status);
    }

    public function test_non_admin_cannot_change_own_role_or_status(): void
    {
        $this->actingAs($this->physio, 'clinic')
            ->putJson("/api/clinic/users/{$this->physio->id}", [
                'name'     => 'Fisio Renomeado',
                'document' => '11144477735',
                'role'     => ClinicUser::ROLE_ADMIN,
                'status'   => 0,
            ])
            ->assertOk();

        $fresh = $this->physio->fresh();
        $this->assertSame('Fisio Renomeado', $fresh->name);
        $this->assertSame(ClinicUser::ROLE_PHYSIOTHERAPIST, $fresh->role);
        $this->assertSame(ClinicUser::STATUS_ACTIVE, (int) $fresh->status);
    }
}
