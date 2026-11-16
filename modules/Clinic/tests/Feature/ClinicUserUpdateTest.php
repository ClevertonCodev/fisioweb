<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
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

    public function test_admin_cannot_change_master_email(): void
    {
        $this->actingAs($this->admin, 'clinic')
            ->putJson("/api/clinic/users/{$this->master->id}", [
                'email' => 'tomada@example.com',
            ])
            ->assertForbidden()
            ->assertJsonPath('message', 'Só o mestre altera o e-mail e a senha dele.');

        $this->assertSame($this->master->email, $this->master->fresh()->email);
    }

    public function test_admin_sending_the_master_email_in_upper_case_does_not_change_it(): void
    {
        $this->actingAs($this->admin, 'clinic')
            ->putJson("/api/clinic/users/{$this->master->id}", [
                'email' => strtoupper($this->master->email),
            ])
            ->assertOk();

        $this->assertSame($this->master->email, $this->master->fresh()->email);
    }

    public function test_admin_cannot_change_master_password(): void
    {
        $this->actingAs($this->admin, 'clinic')
            ->putJson("/api/clinic/users/{$this->master->id}", [
                'password' => 'SenhaTomada123',
            ])
            ->assertForbidden()
            ->assertJsonPath('message', 'Só o mestre altera o e-mail e a senha dele.');

        $this->assertFalse(Hash::check('SenhaTomada123', $this->master->fresh()->password));
    }

    public function test_admin_still_edits_master_name_when_sending_the_current_email(): void
    {
        $this->actingAs($this->admin, 'clinic')
            ->putJson("/api/clinic/users/{$this->master->id}", [
                'name'  => 'Mestre Renomeado',
                'email' => $this->master->email,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Mestre Renomeado');
    }

    public function test_master_changes_own_email_and_password(): void
    {
        // Trocar a própria senha reemite o token: precisa de um JWT de verdade.
        $token = auth('clinic')->login($this->master);
        $this->app['auth']->forgetGuards();

        $this->withToken($token)
            ->putJson("/api/clinic/users/{$this->master->id}", [
                'email'    => 'novo-mestre@example.com',
                'password' => 'NovaSenhaMestre1',
            ])
            ->assertOk()
            ->assertJsonPath('data.email', 'novo-mestre@example.com');

        $fresh = $this->master->fresh();
        $this->assertSame('novo-mestre@example.com', $fresh->email);
        $this->assertTrue(Hash::check('NovaSenhaMestre1', $fresh->password));
    }

    public function test_admin_changes_physiotherapist_password(): void
    {
        $this->actingAs($this->admin, 'clinic')
            ->putJson("/api/clinic/users/{$this->physio->id}", [
                'password' => 'NovaSenhaFisio1',
            ])
            ->assertOk();

        $this->assertTrue(Hash::check('NovaSenhaFisio1', $this->physio->fresh()->password));
    }

    public function test_admin_of_another_clinic_gets_404_on_master(): void
    {
        $outsider = ClinicUser::factory()->create([
            'clinic_id' => Clinic::factory()->create()->id,
            'mestre'    => ClinicUser::MESTRE_YES,
        ]);

        $this->actingAs($outsider, 'clinic')
            ->putJson("/api/clinic/users/{$this->master->id}", [
                'email'    => 'tomada@example.com',
                'password' => 'SenhaTomada123',
            ])
            ->assertNotFound();

        $fresh = $this->master->fresh();
        $this->assertSame($this->master->email, $fresh->email);
        $this->assertFalse(Hash::check('SenhaTomada123', $fresh->password));
    }
}
