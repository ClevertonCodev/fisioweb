<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

/**
 * "Entrar como" do admin do sistema: o token tem que valer, então só um
 * administrador ativo da clínica serve (o guard recusa inativo, ADR 022).
 */
class ClinicLoginAsTest extends TestCase
{
    use RefreshDatabase;

    private AdminUser $systemAdmin;

    private Clinic $clinic;

    private ClinicUser $master;

    protected function setUp(): void
    {
        parent::setUp();

        $this->systemAdmin = AdminUser::factory()->create();
        $this->clinic      = Clinic::factory()->create();
        $this->master      = ClinicUser::where('clinic_id', $this->clinic->id)
            ->where('mestre', ClinicUser::MESTRE_YES)
            ->firstOrFail();
    }

    public function test_logs_in_as_the_master_when_active(): void
    {
        $this->makeAdmin();

        $this->loginAs()
            ->assertOk()
            ->assertJsonPath('user.id', $this->master->id);
    }

    public function test_skips_an_inactive_admin_and_the_token_works(): void
    {
        // Dado legado: mestre inativo, criado antes do admin ativo.
        $this->master->forceFill(['status' => ClinicUser::STATUS_INACTIVE])->save();
        $active = $this->makeAdmin();

        $token = $this->loginAs()
            ->assertOk()
            ->assertJsonPath('user.id', $active->id)
            ->json('access_token');

        $this->app['auth']->forgetGuards();
        $this->withToken($token)
            ->getJson('/api/clinic/auth/me')
            ->assertOk();
    }

    public function test_clinic_without_an_active_admin_is_refused(): void
    {
        $this->master->forceFill(['status' => ClinicUser::STATUS_INACTIVE])->save();

        $this->loginAs()->assertStatus(422);
    }

    private function makeAdmin(): ClinicUser
    {
        return ClinicUser::factory()->create([
            'clinic_id' => $this->clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
            'mestre'    => ClinicUser::MESTRE_NO,
            'status'    => ClinicUser::STATUS_ACTIVE,
        ]);
    }

    private function loginAs()
    {
        return $this->actingAs($this->systemAdmin, 'admin')
            ->postJson("/api/admin/clinics/{$this->clinic->id}/login-as");
    }
}
