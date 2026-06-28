<?php

namespace Modules\ClinicalRecord\Tests\Unit\Events;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Modules\Admin\Contracts\Public\AssessmentTemplateReadServiceInterface;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicalRecord\Events\AssessmentCompleted;
use Modules\ClinicalRecord\Events\AssessmentCreated;
use Modules\ClinicalRecord\Events\AssessmentUpdated;
use Modules\ClinicalRecord\Events\EvolutionRecorded;
use Modules\ClinicalRecord\Events\PatientFileAttached;
use Modules\ClinicalRecord\Events\PatientFileDeleted;
use Modules\ClinicalRecord\Services\AssessmentService;
use Modules\ClinicalRecord\Services\EvolutionService;
use Modules\ClinicalRecord\Services\PatientFileService;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class ClinicalRecordServiceEventsTest extends TestCase
{
    use RefreshDatabase;

    public function test_use_cases_dispatch_clinical_record_events_after_commit(): void
    {
        Event::fake();

        [$clinic, $physio, $patient] = $this->context();
        $this->actingAs($physio, 'clinic');

        DB::table('admin_assessment_templates')->insert([
            'id'          => 100,
            'name'        => 'Template teste',
            'description' => 'Template para testes',
            'is_active'   => true,
            'sort_order'  => 1,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);
        DB::table('admin_assessment_sections')->insert([
            'id'                           => 1,
            'admin_assessment_template_id' => 100,
            'title'                        => 'Seção teste',
            'sort_order'                   => 1,
            'created_at'                   => now(),
            'updated_at'                   => now(),
        ]);
        DB::table('admin_assessment_fields')->insert([
            'id'                          => 10,
            'admin_assessment_section_id' => 1,
            'label'                       => 'Dor',
            'field_type'                  => 'text',
            'required'                    => true,
            'sort_order'                  => 1,
            'created_at'                  => now(),
            'updated_at'                  => now(),
        ]);

        $templateService = $this->mock(AssessmentTemplateReadServiceInterface::class);
        $templateService->shouldReceive('findActiveForValidation')
            ->times(2)
            ->andReturn([
                'id'       => 100,
                'sections' => [
                    [
                        'id'     => 1,
                        'fields' => [
                            ['id' => 10, 'type' => 'text', 'options' => []],
                        ],
                    ],
                ],
            ]);
        $this->instance(AssessmentTemplateReadServiceInterface::class, $templateService);

        $assessmentService  = app(AssessmentService::class);
        $evolutionService   = app(EvolutionService::class);
        $patientFileService = app(PatientFileService::class);

        $assessment = $assessmentService->create([
            'admin_assessment_template_id' => 100,
            'answers'                      => [['field_id' => 10, 'value' => 'Dor moderada']],
        ], (int) $clinic->id, (int) $patient->id, (int) $physio->id);

        $assessmentService->update($assessment, [
            'answers' => [['field_id' => 10, 'value' => 'Dor leve']],
        ]);
        $assessmentService->sign($assessment->fresh(), (int) $physio->id);

        $evolution = $evolutionService->create([
            'title' => 'Sessão 1',
        ], (int) $clinic->id, (int) $patient->id, (int) $physio->id);

        $evolutionService->update($evolution, ['title' => 'Sessão 1 - ajuste']);
        $evolutionService->sign($evolution->fresh(), (int) $physio->id);

        $file = $patientFileService->store(
            (int) $clinic->id,
            (int) $patient->id,
            (int) $physio->id,
            [
                'original_filename' => 'laudo.pdf',
                'path'              => 'patients/files/laudo.pdf',
                'cdn_url'           => 'https://cdn.example.com/patients/files/laudo.pdf',
                'mime_type'         => 'application/pdf',
                'size'              => 1024,
            ],
            'Laudo',
        );
        $patientFileService->destroy($file);

        Event::assertDispatched(AssessmentCreated::class);
        Event::assertDispatched(AssessmentUpdated::class);
        Event::assertDispatched(AssessmentCompleted::class);
        Event::assertDispatchedTimes(EvolutionRecorded::class, 3);
        Event::assertDispatched(PatientFileAttached::class);
        Event::assertDispatched(PatientFileDeleted::class);

        Event::assertDispatched(AssessmentCreated::class, fn (AssessmentCreated $event): bool => !isset($event->assessment));
        Event::assertDispatched(EvolutionRecorded::class, fn (EvolutionRecorded $event): bool => !isset($event->evolution));
        Event::assertDispatched(PatientFileAttached::class, fn (PatientFileAttached $event): bool => !isset($event->file));
    }

    private function context(): array
    {
        $clinic = Clinic::factory()->create();
        $physio = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);
        $patient = Patient::factory()->create(['clinic_id' => $clinic->id]);

        return [$clinic, $physio, $patient];
    }
}
