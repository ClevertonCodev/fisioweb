<?php

namespace Modules\Patient\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Contracts\PatientRepositoryInterface;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

/**
 * O controller já devolve 404 para paciente de outra clínica; este teste
 * protege a segunda camada, o filtro por clinic_id no próprio repository.
 */
class PatientRepositoryReactivateTest extends TestCase
{
    use RefreshDatabase;

    public function test_reactivate_does_not_touch_patient_of_another_clinic(): void
    {
        $clinicA  = Clinic::factory()->create();
        $clinicB  = Clinic::factory()->create();
        $patientB = Patient::factory()->create([
            'clinic_id'      => $clinicB->id,
            'clinic_user_id' => ClinicUser::factory()->create(['clinic_id' => $clinicB->id])->id,
            'is_active'      => false,
        ]);

        $result = app(PatientRepositoryInterface::class)->reactivate($clinicA->id, $patientB->id);

        $this->assertNull($result);
        $this->assertDatabaseHas('patients', ['id' => $patientB->id, 'is_active' => false]);
    }

    public function test_reactivate_returns_own_clinic_patient_active(): void
    {
        $clinic  = Clinic::factory()->create();
        $patient = Patient::factory()->create([
            'clinic_id'      => $clinic->id,
            'clinic_user_id' => ClinicUser::factory()->create(['clinic_id' => $clinic->id])->id,
            'is_active'      => false,
        ]);

        $result = app(PatientRepositoryInterface::class)->reactivate($clinic->id, $patient->id);

        $this->assertSame($patient->id, $result?->id);
        $this->assertTrue($result->is_active);
    }
}
