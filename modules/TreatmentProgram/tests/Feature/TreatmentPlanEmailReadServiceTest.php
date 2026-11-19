<?php

namespace Modules\TreatmentProgram\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\TreatmentProgram\Contracts\Public\TreatmentPlanEmailReadServiceInterface;
use Modules\TreatmentProgram\Tests\Support\CreatesPatientProgramFixtures;
use Tests\TestCase;

class TreatmentPlanEmailReadServiceTest extends TestCase
{
    use CreatesPatientProgramFixtures;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpPatientProgramFixtures();
    }

    public function test_returns_program_email_data_for_own_clinic(): void
    {
        $patient   = $this->createPatient();
        $startDate = now()->addDay()->toDateString();
        $endDate   = now()->addDays(30)->toDateString();

        $fixture = $this->createActiveProgram($patient, [
            'title'      => 'Fortalecimento de joelho · fase 1',
            'message'    => 'Faça 3 vezes por semana.',
            'start_date' => $startDate,
            'end_date'   => $endDate,
        ]);

        $plan = $fixture['plan'];

        $service = app(TreatmentPlanEmailReadServiceInterface::class);
        $dto     = $service->findForEmail($this->clinicUser->clinic_id, $plan->id);

        $this->assertNotNull($dto);
        $this->assertSame($plan->id, $dto->id);
        $this->assertSame($this->clinicUser->clinic_id, $dto->clinicId);
        $this->assertSame($patient->id, $dto->patientId);
        $this->assertSame($this->clinicUser->id, $dto->professionalId);
        $this->assertSame('Fortalecimento de joelho · fase 1', $dto->title);
        $this->assertSame('Faça 3 vezes por semana.', $dto->message);
        $this->assertSame($startDate, $dto->startDate);
        $this->assertSame($endDate, $dto->endDate);
        $this->assertSame(1, $dto->exercisesCount);
        $this->assertSame('active', $dto->status);
        $this->assertSame(
            rtrim((string) config('app.url'), '/') . '/clinica-teste/paciente/programas/' . $plan->public_token,
            $dto->shareUrl,
        );
    }

    public function test_returns_null_when_program_belongs_to_another_clinic(): void
    {
        $patient = $this->createPatient();
        $fixture = $this->createActiveProgram($patient);
        $clinicB = Clinic::factory()->create();

        $service = app(TreatmentPlanEmailReadServiceInterface::class);

        $this->assertNull($service->findForEmail($clinicB->id, $fixture['plan']->id));
    }
}
