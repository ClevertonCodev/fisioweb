<?php

namespace Modules\TreatmentProgram\Tests\Feature;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Contracts\Public\TreatmentProgramReadServiceInterface;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Tests\TestCase;

class TreatmentProgramReadServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_counts_active_plans_of_active_patients_in_current_month(): void
    {
        $clinic = Clinic::factory()->create();
        $user   = ClinicUser::factory()->create(['clinic_id' => $clinic->id]);

        $activePatient   = Patient::factory()->create(['clinic_id' => $clinic->id, 'status' => 'em_tratamento']);
        $inactivePatient = Patient::factory()->create(['clinic_id' => $clinic->id, 'status' => 'alta']);

        $this->makePlan($clinic->id, $user->id, $activePatient->id, TreatmentPlan::STATUS_ACTIVE);
        $this->makePlan($clinic->id, $user->id, $inactivePatient->id, TreatmentPlan::STATUS_ACTIVE); // paciente inativo → não conta
        $this->makePlan($clinic->id, $user->id, $activePatient->id, TreatmentPlan::STATUS_DRAFT);     // não-ativo → não conta

        $service    = app(TreatmentProgramReadServiceInterface::class);
        $monthStart = Carbon::now()->startOfMonth()->toDateString();
        $monthEnd   = Carbon::now()->endOfMonth()->toDateString();

        $this->assertSame(1, $service->activeProgramsCount($clinic->id, null, $monthStart, $monthEnd));
        $this->assertSame(1, $service->activeProgramsCount($clinic->id, $user->id, $monthStart, $monthEnd));
        $this->assertSame(0, $service->activeProgramsCount($clinic->id, $user->id + 999, $monthStart, $monthEnd));
    }

    private function makePlan(int $clinicId, int $userId, int $patientId, string $status): void
    {
        TreatmentPlan::create([
            'clinic_id'      => $clinicId,
            'clinic_user_id' => $userId,
            'patient_id'     => $patientId,
            'title'          => 'Programa',
            'status'         => $status,
            'start_date'     => Carbon::now()->startOfMonth()->toDateString(),
            'end_date'       => Carbon::now()->endOfMonth()->toDateString(),
        ]);
    }
}
