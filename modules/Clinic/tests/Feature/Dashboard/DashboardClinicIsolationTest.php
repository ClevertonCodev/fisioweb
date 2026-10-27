<?php

namespace Modules\Clinic\Tests\Feature\Dashboard;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\Patient\Contracts\PatientServiceInterface;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class DashboardClinicIsolationTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $adminA;

    private ClinicUser $adminB;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();

        $clinicA      = Clinic::factory()->create(['timezone' => 'UTC']);
        $clinicB      = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->adminA = ClinicUser::factory()->create(['clinic_id' => $clinicA->id]);
        $this->adminB = ClinicUser::factory()->create(['clinic_id' => $clinicB->id]);
        $physioA      = ClinicUser::factory()->create(['clinic_id' => $clinicA->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);

        $patientA = Patient::factory()->create([
            'clinic_id'       => $clinicA->id,
            'clinic_user_id'  => $physioA->id,
            'status'          => 'em_tratamento',
            'referral_source' => 'google',
        ]);

        $start = Carbon::now()->startOfDay()->addHours(9);
        Appointment::factory()->create([
            'clinic_id'      => $clinicA->id,
            'clinic_user_id' => $physioA->id,
            'patient_id'     => $patientA->id,
            'starts_at'      => $start,
            'ends_at'        => $start->copy()->addHour(),
        ]);

        // Gera uma atividade do dia na clínica A.
        $this->actingAs($this->adminA, 'clinic');
        app(PatientServiceInterface::class)->create(['name' => 'Paciente A', 'email' => 'a@example.com'], $clinicA->id);
    }

    public function test_summary_of_another_clinic_does_not_count_this_clinic_data(): void
    {
        $this->actingAs($this->adminA, 'clinic')
            ->getJson('/api/clinic/dashboard')
            ->assertOk()
            ->assertJsonPath('data.cards.appointments_today', 1);

        $this->actingAs($this->adminB, 'clinic')
            ->getJson('/api/clinic/dashboard')
            ->assertOk()
            ->assertJsonPath('data.cards.active_patients', 0)
            ->assertJsonPath('data.cards.appointments_today', 0);
    }

    public function test_patient_acquisition_of_another_clinic_does_not_count_this_clinic_patients(): void
    {
        $sourcesA = collect($this->actingAs($this->adminA, 'clinic')
            ->getJson('/api/clinic/dashboard/patient-acquisition')
            ->assertOk()
            ->json('data.sources'))->pluck('source');
        $this->assertContains('google', $sourcesA);

        $sourcesB = collect($this->actingAs($this->adminB, 'clinic')
            ->getJson('/api/clinic/dashboard/patient-acquisition')
            ->assertOk()
            ->json('data.sources'))->pluck('source');
        $this->assertNotContains('google', $sourcesB);
    }

    public function test_activities_of_another_clinic_do_not_include_this_clinic_activities(): void
    {
        $this->actingAs($this->adminA, 'clinic')
            ->getJson('/api/clinic/dashboard/activities')
            ->assertOk()
            ->assertJsonCount(1, 'data.items');

        $this->actingAs($this->adminB, 'clinic')
            ->getJson('/api/clinic/dashboard/activities')
            ->assertOk()
            ->assertJsonCount(0, 'data.items');
    }
}
