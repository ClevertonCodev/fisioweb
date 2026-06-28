<?php

namespace Modules\ClinicQuestionnaire\Tests\Unit\Events;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicQuestionnaire\Events\QuestionnaireAnswered;
use Modules\ClinicQuestionnaire\Events\QuestionnaireCancelled;
use Modules\ClinicQuestionnaire\Events\QuestionnaireExpired;
use Modules\ClinicQuestionnaire\Events\QuestionnaireSent;
use Modules\ClinicQuestionnaire\Events\QuestionnaireTemplateCreated;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;
use Modules\ClinicQuestionnaire\Models\QuestionnaireQuestion;
use Modules\ClinicQuestionnaire\Models\QuestionnaireSection;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;
use Modules\ClinicQuestionnaire\Services\PatientQuestionnaireService;
use Modules\ClinicQuestionnaire\Services\QuestionnaireTemplateService;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class ClinicQuestionnaireServiceEventsTest extends TestCase
{
    use RefreshDatabase;

    public function test_services_dispatch_questionnaire_events_after_commit(): void
    {
        Event::fake();

        [$clinic, $physio, $patient, $template] = $this->context();

        $templateService      = app(QuestionnaireTemplateService::class);
        $questionnaireService = app(PatientQuestionnaireService::class);

        $createdTemplate = $templateService->create([
            'title'    => 'Template evento',
            'sections' => [
                [
                    'title'     => 'Seção',
                    'questions' => [
                        ['label' => 'Pergunta', 'type' => 'text', 'required' => true],
                    ],
                ],
            ],
        ], (int) $clinic->id);

        Event::assertDispatched(QuestionnaireTemplateCreated::class);

        $questionnaire = $questionnaireService->send(
            (int) $clinic->id,
            (int) $patient->id,
            (int) $physio->id,
            [
                'questionnaire_template_id' => $createdTemplate->id,
                'modality'                  => PatientQuestionnaire::MODALITY_REMOTO,
            ],
        );

        Event::assertDispatched(QuestionnaireSent::class);

        $section  = QuestionnaireSection::where('questionnaire_template_id', $createdTemplate->id)->first();
        $question = QuestionnaireQuestion::where('questionnaire_section_id', $section->id)->first();

        $questionnaireService->answer($questionnaire, [
            ['question_id' => $question->id, 'answer' => 'Resposta teste'],
        ]);

        Event::assertDispatched(QuestionnaireAnswered::class);

        $pending = $questionnaireService->send(
            (int) $clinic->id,
            (int) $patient->id,
            (int) $physio->id,
            [
                'questionnaire_template_id' => $createdTemplate->id,
                'modality'                  => PatientQuestionnaire::MODALITY_PRESENCIAL,
                'expires_at'                => now()->subMinute()->toDateTimeString(),
            ],
        );

        try {
            $questionnaireService->showForPublic($pending->id);
        } catch (\Throwable) {
            // expected validation failure after expiry mark
        }

        Event::assertDispatched(QuestionnaireExpired::class);

        $toCancel = $questionnaireService->send(
            (int) $clinic->id,
            (int) $patient->id,
            (int) $physio->id,
            [
                'questionnaire_template_id' => $createdTemplate->id,
                'modality'                  => PatientQuestionnaire::MODALITY_PRESENCIAL,
            ],
        );

        $questionnaireService->destroy($toCancel);

        Event::assertDispatched(QuestionnaireCancelled::class);
    }

    /**
     * @return array{0: Clinic, 1: ClinicUser, 2: Patient, 3: QuestionnaireTemplate}
     */
    private function context(): array
    {
        $physio   = ClinicUser::factory()->create();
        $clinic   = Clinic::find($physio->clinic_id);
        $patient  = Patient::factory()->forClinic($clinic)->create();
        $template = QuestionnaireTemplate::factory()->forClinic($clinic)->create();

        return [$clinic, $physio, $patient, $template];
    }
}
