<?php

namespace Modules\Clinic\Tests\Feature\Dashboard;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Modules\Clinic\Models\Appointment;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class DashboardScopeTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    private ClinicUser $secretary;

    private ClinicUser $physioA;

    private ClinicUser $physioB;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();

        $this->clinic    = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->admin     = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $this->secretary = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $this->physioA   = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->physioB   = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);

        // 2 pacientes ativos de A, 1 de B.
        Patient::factory()->count(2)->create(['clinic_id' => $this->clinic->id, 'clinic_user_id' => $this->physioA->id, 'status' => 'em_tratamento']);
        Patient::factory()->create(['clinic_id' => $this->clinic->id, 'clinic_user_id' => $this->physioB->id, 'status' => 'em_tratamento']);

        // Consulta de hoje para cada fisio.
        $this->appointmentToday($this->physioA);
        $this->appointmentToday($this->physioB);
    }

    private function appointmentToday(ClinicUser $physio): void
    {
        $start = Carbon::now()->startOfDay()->addHours(9);
        Appointment::factory()->create([
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $physio->id,
            'patient_id'     => Patient::factory()->create(['clinic_id' => $this->clinic->id, 'clinic_user_id' => $physio->id])->id,
            'starts_at'      => $start,
            'ends_at'        => $start->copy()->addHour(),
        ]);
    }

    public function test_physiotherapist_sees_only_own_scope(): void
    {
        $this->actingAs($this->physioA, 'clinic')
            ->getJson('/api/clinic/dashboard')
            ->assertOk()
            ->assertJsonPath('data.cards.active_patients', 3) // 2 do setup + 1 criado p/ a consulta
            ->assertJsonPath('data.cards.appointments_today', 1)
            ->assertJsonPath('data.viewer.can_view_activities', false)
            ->assertJsonPath('data.viewer.can_toggle_scope', false)
            ->assertJsonPath('data.viewer.can_choose_professional', false);
    }

    public function test_physiotherapist_cannot_widen_scope_with_forged_params(): void
    {
        // Mesmo pedindo scope=clinic, o fisioterapeuta continua restrito a si (SC-004).
        $this->actingAs($this->physioA, 'clinic')
            ->getJson('/api/clinic/dashboard?scope=clinic')
            ->assertOk()
            ->assertJsonPath('data.cards.appointments_today', 1)
            ->assertJsonPath('data.viewer.current_scope', 'mine');
    }

    public function test_admin_mine_scope_filters_to_self(): void
    {
        // Admin não atende (sem consultas próprias) → "mine" zera consultas de hoje.
        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/dashboard?scope=mine')
            ->assertOk()
            ->assertJsonPath('data.cards.appointments_today', 0)
            ->assertJsonPath('data.viewer.current_scope', 'mine');

        // Sem scope → clínica inteira (2 consultas de hoje).
        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/dashboard')
            ->assertOk()
            ->assertJsonPath('data.cards.appointments_today', 2)
            ->assertJsonPath('data.viewer.current_scope', 'clinic');
    }

    public function test_secretary_ignores_mine_scope_and_sees_clinic_wide(): void
    {
        $this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/dashboard?scope=mine')
            ->assertOk()
            ->assertJsonPath('data.cards.appointments_today', 2)
            ->assertJsonPath('data.viewer.can_toggle_scope', false)
            ->assertJsonPath('data.viewer.current_scope', 'clinic');
    }
}
