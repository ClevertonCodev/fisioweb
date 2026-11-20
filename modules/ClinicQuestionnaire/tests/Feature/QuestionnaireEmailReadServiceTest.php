<?php

namespace Modules\ClinicQuestionnaire\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicQuestionnaire\Contracts\Public\QuestionnaireEmailReadServiceInterface;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;
use Modules\ClinicQuestionnaire\Models\QuestionnaireQuestion;
use Modules\ClinicQuestionnaire\Models\QuestionnaireSection;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class QuestionnaireEmailReadServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_send_email_data_for_own_clinic_and_null_for_another(): void
    {
        $clinic   = Clinic::factory()->create(['slug' => 'clinica-email']);
        $user     = ClinicUser::factory()->create(['clinic_id' => $clinic->id]);
        $patient  = Patient::factory()->forClinic($clinic)->create();
        $template = QuestionnaireTemplate::factory()->forClinic($clinic)->create([
            'title' => 'Avaliação de dor e função',
        ]);
        $section = QuestionnaireSection::query()->create([
            'questionnaire_template_id' => $template->id,
            'title'                     => 'Dor',
            'sort_order'                => 0,
        ]);
        QuestionnaireQuestion::query()->create([
            'questionnaire_section_id' => $section->id,
            'label'                    => 'Onde dói?',
            'type'                     => QuestionnaireQuestion::TYPE_TEXT,
            'required'                 => true,
            'sort_order'               => 0,
        ]);
        QuestionnaireQuestion::query()->create([
            'questionnaire_section_id' => $section->id,
            'label'                    => 'De 0 a 10',
            'type'                     => QuestionnaireQuestion::TYPE_SCALE,
            'required'                 => true,
            'sort_order'               => 1,
        ]);
        QuestionnaireQuestion::query()->create([
            'questionnaire_section_id' => $section->id,
            'label'                    => 'Pergunta arquivada',
            'type'                     => QuestionnaireQuestion::TYPE_TEXT,
            'required'                 => false,
            'sort_order'               => 2,
            'archived_at'              => now(),
        ]);

        $expiresAt     = now()->addDays(3);
        $questionnaire = PatientQuestionnaire::factory()->forPatient($patient, $clinic)->create([
            'clinic_user_id'            => $user->id,
            'questionnaire_template_id' => $template->id,
            'modality'                  => PatientQuestionnaire::MODALITY_REMOTO,
            'status'                    => PatientQuestionnaire::STATUS_PENDING,
            'expires_at'                => $expiresAt,
        ]);

        $service = app(QuestionnaireEmailReadServiceInterface::class);
        $dto     = $service->findForEmail($clinic->id, $questionnaire->id);

        $this->assertNotNull($dto);
        $this->assertSame($questionnaire->id, $dto->id);
        $this->assertSame($clinic->id, $dto->clinicId);
        $this->assertSame($patient->id, $dto->patientId);
        $this->assertSame('Avaliação de dor e função', $dto->title);
        $this->assertSame(2, $dto->questionsCount);
        $this->assertSame($questionnaire->fresh()->expires_at?->toIso8601String(), $dto->expiresAt);
        $this->assertSame(PatientQuestionnaire::STATUS_PENDING, $dto->status);
        $this->assertSame(
            rtrim((string) config('app.url'), '/')
            . '/clinica-email/paciente/questionarios/'
            . $questionnaire->public_token,
            $dto->shareUrl,
        );

        $clinicB = Clinic::factory()->create();
        $this->assertNull($service->findForEmail($clinicB->id, $questionnaire->id));
    }
}
