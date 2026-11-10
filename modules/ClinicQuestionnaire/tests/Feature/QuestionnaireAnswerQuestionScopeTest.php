<?php

namespace Modules\ClinicQuestionnaire\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;
use Modules\ClinicQuestionnaire\Models\QuestionnaireQuestion;
use Modules\ClinicQuestionnaire\Models\QuestionnaireSection;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class QuestionnaireAnswerQuestionScopeTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinicA;

    private Clinic $clinicB;

    private ClinicUser $userA;

    private Patient $patientA;

    private QuestionnaireQuestion $questionA;

    private QuestionnaireQuestion $questionB;

    private QuestionnaireTemplate $templateA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinicA  = Clinic::factory()->create();
        $this->clinicB  = Clinic::factory()->create();
        $this->userA    = ClinicUser::factory()->create(['clinic_id' => $this->clinicA->id]);
        $this->patientA = Patient::factory()->forClinic($this->clinicA)->create();

        [$this->templateA, $this->questionA] = $this->createTemplateWithQuestion($this->clinicA, 'Qual a queixa?');
        [, $this->questionB]                 = $this->createTemplateWithQuestion($this->clinicB, 'Pergunta da clínica B');
    }

    public function test_clinic_answer_with_question_of_another_clinic_template_returns_422_and_saves_nothing(): void
    {
        $questionnaire = $this->createQuestionnaire(PatientQuestionnaire::MODALITY_PRESENCIAL);

        $this->actingAs($this->userA, 'clinic')
            ->postJson($this->clinicAnswerUrl($questionnaire), [
                'answers' => [
                    ['question_id' => $this->questionA->id, 'answer' => 'Dor lombar'],
                    ['question_id' => $this->questionB->id, 'answer' => 'Invasão'],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'A pergunta informada não pertence a este questionário.');

        $this->assertDatabaseCount('clinic_patient_questionnaire_answers', 0);
        $this->assertSame(PatientQuestionnaire::STATUS_PENDING, $questionnaire->fresh()->status);
    }

    public function test_public_answer_with_question_of_another_clinic_template_returns_422_and_saves_nothing(): void
    {
        $questionnaire = $this->createQuestionnaire(PatientQuestionnaire::MODALITY_REMOTO);

        $this->postJson("/api/questionnaires/{$questionnaire->public_token}/answer", [
            'answers' => [
                ['question_id' => $this->questionB->id, 'answer' => 'Invasão'],
            ],
        ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'A pergunta informada não pertence a este questionário.');

        $this->assertDatabaseCount('clinic_patient_questionnaire_answers', 0);
        $this->assertSame(PatientQuestionnaire::STATUS_PENDING, $questionnaire->fresh()->status);
    }

    public function test_answer_with_questions_of_own_template_is_saved(): void
    {
        $presencial = $this->createQuestionnaire(PatientQuestionnaire::MODALITY_PRESENCIAL);
        $remoto     = $this->createQuestionnaire(PatientQuestionnaire::MODALITY_REMOTO);

        $this->actingAs($this->userA, 'clinic')
            ->postJson($this->clinicAnswerUrl($presencial), [
                'answers' => [['question_id' => $this->questionA->id, 'answer' => 'Dor lombar']],
            ])
            ->assertOk()
            ->assertJsonPath('data.status', PatientQuestionnaire::STATUS_ANSWERED);

        $this->postJson("/api/questionnaires/{$remoto->public_token}/answer", [
            'answers' => [['question_id' => $this->questionA->id, 'answer' => 'Dor no ombro']],
        ])
            ->assertOk()
            ->assertJsonPath('data.status', PatientQuestionnaire::STATUS_ANSWERED);

        $this->assertDatabaseHas('clinic_patient_questionnaire_answers', [
            'patient_questionnaire_id'  => $presencial->id,
            'questionnaire_question_id' => $this->questionA->id,
        ]);
        $this->assertDatabaseHas('clinic_patient_questionnaire_answers', [
            'patient_questionnaire_id'  => $remoto->id,
            'questionnaire_question_id' => $this->questionA->id,
        ]);
    }

    public function test_answer_with_question_of_another_template_of_same_clinic_returns_422(): void
    {
        [, $otherQuestion] = $this->createTemplateWithQuestion($this->clinicA, 'Pergunta de outro modelo da A');
        $questionnaire     = $this->createQuestionnaire(PatientQuestionnaire::MODALITY_REMOTO);

        $this->postJson("/api/questionnaires/{$questionnaire->public_token}/answer", [
            'answers' => [
                ['question_id' => $this->questionA->id, 'answer' => 'Dor lombar'],
                ['question_id' => $otherQuestion->id, 'answer' => 'Fora do modelo'],
            ],
        ])->assertStatus(422);

        $this->assertDatabaseCount('clinic_patient_questionnaire_answers', 0);
    }

    public function test_nonexistent_question_gets_the_same_message_as_a_foreign_one(): void
    {
        $questionnaire = $this->createQuestionnaire(PatientQuestionnaire::MODALITY_REMOTO);

        $this->postJson("/api/questionnaires/{$questionnaire->public_token}/answer", [
            'answers' => [['question_id' => 999999, 'answer' => 'Sondagem']],
        ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'A pergunta informada não pertence a este questionário.');
    }

    public function test_archived_question_of_own_template_is_still_accepted(): void
    {
        $questionnaire = $this->createQuestionnaire(PatientQuestionnaire::MODALITY_REMOTO);
        $this->questionA->forceFill(['archived_at' => now()])->save();

        $this->postJson("/api/questionnaires/{$questionnaire->public_token}/answer", [
            'answers' => [['question_id' => $this->questionA->id, 'answer' => 'Respondido antes da edição']],
        ])->assertOk();
    }

    public function test_user_of_another_clinic_cannot_answer_the_questionnaire(): void
    {
        $questionnaire = $this->createQuestionnaire(PatientQuestionnaire::MODALITY_PRESENCIAL);
        $userB         = ClinicUser::factory()->create(['clinic_id' => $this->clinicB->id]);

        $this->actingAs($userB, 'clinic')
            ->postJson($this->clinicAnswerUrl($questionnaire), [
                'answers' => [['question_id' => $this->questionA->id, 'answer' => 'Invasão']],
            ])
            ->assertNotFound();

        $this->assertDatabaseCount('clinic_patient_questionnaire_answers', 0);
        $this->assertSame(PatientQuestionnaire::STATUS_PENDING, $questionnaire->fresh()->status);
    }

    private function clinicAnswerUrl(PatientQuestionnaire $questionnaire): string
    {
        return "/api/clinic/patients/{$this->patientA->id}/questionnaires/{$questionnaire->id}/answer";
    }

    private function createQuestionnaire(string $modality): PatientQuestionnaire
    {
        return PatientQuestionnaire::factory()
            ->forPatient($this->patientA, $this->clinicA)
            ->create([
                'questionnaire_template_id' => $this->templateA->id,
                'modality'                  => $modality,
                'status'                    => PatientQuestionnaire::STATUS_PENDING,
            ]);
    }

    /**
     * @return array{0: QuestionnaireTemplate, 1: QuestionnaireQuestion}
     */
    private function createTemplateWithQuestion(Clinic $clinic, string $label): array
    {
        $template = QuestionnaireTemplate::factory()->forClinic($clinic)->create();
        $section  = QuestionnaireSection::query()->create([
            'questionnaire_template_id' => $template->id,
            'title'                     => 'Anamnese',
            'sort_order'                => 0,
        ]);
        $question = QuestionnaireQuestion::query()->create([
            'questionnaire_section_id' => $section->id,
            'label'                    => $label,
            'type'                     => QuestionnaireQuestion::TYPE_TEXT,
            'options'                  => null,
            'scale_min'                => 0,
            'scale_max'                => 10,
            'required'                 => true,
            'sort_order'               => 0,
        ]);

        return [$template, $question];
    }
}
