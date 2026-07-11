<?php

namespace Modules\Clinic\Tests\Feature\Dashboard;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Tests\TestCase;

class DashboardAggregateTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    private ClinicUser $physioA;

    private ClinicUser $physioB;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();

        $this->clinic  = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->admin   = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $this->physioA = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->physioB = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
    }

    private function patient(array $overrides = []): Patient
    {
        return Patient::factory()->create(array_merge([
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $this->physioA->id,
        ], $overrides));
    }

    private function appointmentToday(ClinicUser $physio, int $hour, array $overrides = []): Appointment
    {
        $start = Carbon::now()->startOfDay()->addHours($hour);

        return Appointment::factory()->create(array_merge([
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $physio->id,
            'patient_id'     => $this->patient()->id,
            'starts_at'      => $start,
            'ends_at'        => $start->copy()->addHour(),
        ], $overrides));
    }

    public function test_active_patients_excludes_obito_cancelado_alta(): void
    {
        $this->patient(['status' => 'em_tratamento']);
        $this->patient(['status' => 'em_prevencao']);
        $this->patient(['status' => 'obito']);
        $this->patient(['status' => 'cancelado']);
        $this->patient(['status' => 'alta']);

        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/dashboard')
            ->assertOk()
            ->assertJsonPath('data.cards.active_patients', 2);
    }

    public function test_appointments_today_counts_clinic_wide_and_excludes_cancelled_and_other_days(): void
    {
        $this->appointmentToday($this->physioA, 9);
        $this->appointmentToday($this->physioB, 10);
        $this->appointmentToday($this->physioA, 11, ['status' => AppointmentStatus::Cancelled]);
        // Consulta em outro dia não conta:
        $other = Carbon::now()->startOfDay()->addDays(2)->addHours(9);
        Appointment::factory()->create([
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $this->physioA->id,
            'patient_id'     => $this->patient()->id,
            'starts_at'      => $other,
            'ends_at'        => $other->copy()->addHour(),
        ]);

        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/dashboard')
            ->assertOk()
            ->assertJsonPath('data.cards.appointments_today', 2);
    }

    public function test_upcoming_appointments_are_limited_to_five_and_ordered(): void
    {
        foreach ([13, 8, 11, 9, 16, 10] as $hour) {
            $this->appointmentToday($this->physioA, $hour);
        }

        $response = $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/dashboard')
            ->assertOk()
            ->assertJsonCount(5, 'data.upcoming_appointments');

        $hours = array_map(
            fn ($a) => Carbon::parse($a['starts_at'])->hour,
            $response->json('data.upcoming_appointments'),
        );
        $this->assertSame([8, 9, 10, 11, 13], $hours);
    }

    public function test_active_programs_counts_active_plans_of_active_patients_in_current_month(): void
    {
        $activePatient   = $this->patient(['status' => 'em_tratamento']);
        $inactivePatient = $this->patient(['status' => 'alta']);

        $this->makePlan($activePatient, TreatmentPlan::STATUS_ACTIVE);
        // Plano ativo, mas paciente inativo → não conta:
        $this->makePlan($inactivePatient, TreatmentPlan::STATUS_ACTIVE);
        // Plano não-ativo → não conta:
        $this->makePlan($activePatient, TreatmentPlan::STATUS_DRAFT);

        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/dashboard')
            ->assertOk()
            ->assertJsonPath('data.cards.active_programs', 1);
    }

    public function test_viewer_flags_for_admin(): void
    {
        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/dashboard')
            ->assertOk()
            ->assertJsonPath('data.viewer.can_toggle_scope', true)
            ->assertJsonPath('data.viewer.can_choose_professional', true)
            ->assertJsonPath('data.viewer.can_view_activities', true)
            ->assertJsonPath('data.viewer.current_scope', 'clinic');
    }

    private function makePlan(Patient $patient, string $status): TreatmentPlan
    {
        return TreatmentPlan::create([
            'clinic_id'      => $this->clinic->id,
            'patient_id'     => $patient->id,
            'clinic_user_id' => $this->physioA->id,
            'title'          => 'Programa',
            'status'         => $status,
            'start_date'     => Carbon::now()->startOfMonth()->toDateString(),
            'end_date'       => Carbon::now()->endOfMonth()->toDateString(),
        ]);
    }
}
