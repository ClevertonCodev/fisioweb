<?php

namespace Modules\ClinicQuestionnaire\Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaireAnswer;
use Modules\ClinicQuestionnaire\Models\QuestionnaireQuestion;
use Modules\ClinicQuestionnaire\Models\QuestionnaireSection;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class QuestionnaireTemplateHistoryTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinicA;

    private Clinic $clinicB;

    private ClinicUser $adminA;

    private ClinicUser $adminB;

    private Patient $patientA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinicA  = Clinic::factory()->create();
        $this->clinicB  = Clinic::factory()->create();
        $this->adminA   = ClinicUser::factory()->create(['clinic_id' => $this->clinicA->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $this->adminB   = ClinicUser::factory()->create(['clinic_id' => $this->clinicB->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $this->patientA = Patient::factory()->create([
            'clinic_id'      => $this->clinicA->id,
            'clinic_user_id' => $this->adminA->id,
        ]);
    }

    public function test_editing_and_deleting_a_used_questionnaire_template_preserves_patient_answers_and_restricts_question_deletion(): void
    {
        [$unused, $unusedSection, $unusedQ1] = $this->createQuestionnaireWithTwoQuestions($this->clinicA->id);
        [$template, $section, $q1, $q2]      = $this->createQuestionnaireWithTwoQuestions($this->clinicA->id);

        // Excluir questionário nunca usado apaga fisicamente perguntas, seções e template.
        $this->actingAs($this->adminA, 'clinic')
            ->deleteJson("/api/clinic/questionnaire-templates/{$unused->id}")
            ->assertOk();
        $this->assertDatabaseMissing('clinic_questionnaire_templates', ['id' => $unused->id]);
        $this->assertDatabaseMissing('clinic_questionnaire_sections', ['id' => $unusedSection->id]);
        $this->assertDatabaseMissing('clinic_questionnaire_questions', ['id' => $unusedQ1->id]);

        $sent = PatientQuestionnaire::forceCreate([
            'clinic_id'                 => $this->clinicA->id,
            'patient_id'                => $this->patientA->id,
            'clinic_user_id'            => $this->adminA->id,
            'questionnaire_template_id' => $template->id,
            'modality'                  => 'remoto',
            'status'                    => PatientQuestionnaire::STATUS_ANSWERED,
            'answered_at'               => now(),
        ]);
        PatientQuestionnaireAnswer::forceCreate([
            'patient_questionnaire_id'  => $sent->id,
            'questionnaire_question_id' => $q1->id,
            'answer'                    => 7,
        ]);
        PatientQuestionnaireAnswer::forceCreate([
            'patient_questionnaire_id'  => $sent->id,
            'questionnaire_question_id' => $q2->id,
            'answer'                    => 'Dor ao subir escada',
        ]);

        // Edita mantendo q1 e removendo q2 (que deve ser arquivada, não apagada).
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/questionnaire-templates/{$template->id}", [
                'title'       => 'Questionário atualizado',
                'description' => 'Nova descrição',
                'sections'    => [
                    [
                        'id'         => $section->id,
                        'title'      => 'Avaliação de dor',
                        'sort_order' => 0,
                        'questions'  => [
                            [
                                'id'         => $q1->id,
                                'label'      => 'Qual a nota da dor hoje?',
                                'type'       => 'scale',
                                'scale_min'  => 0,
                                'scale_max'  => 10,
                                'required'   => true,
                                'sort_order' => 0,
                            ],
                        ],
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.sections.0.id', $section->id)
            ->assertJsonCount(1, 'data.sections.0.questions')
            ->assertJsonPath('data.sections.0.questions.0.id', $q1->id)
            ->assertJsonPath('data.sections.0.questions.0.label', 'Qual a nota da dor hoje?');

        $this->assertNull($q1->fresh()->archived_at);
        $this->assertNotNull($q2->fresh()->archived_at);

        // Respostas das duas perguntas continuam no banco.
        $this->assertDatabaseHas('clinic_patient_questionnaire_answers', [
            'patient_questionnaire_id'  => $sent->id,
            'questionnaire_question_id' => $q1->id,
        ]);
        $this->assertDatabaseHas('clinic_patient_questionnaire_answers', [
            'patient_questionnaire_id'  => $sent->id,
            'questionnaire_question_id' => $q2->id,
        ]);

        // Excluir modelo usado faz soft delete sem apagar seções, perguntas nem respostas.
        $this->actingAs($this->adminA, 'clinic')
            ->deleteJson("/api/clinic/questionnaire-templates/{$template->id}")
            ->assertOk();
        $this->assertSoftDeleted('clinic_questionnaire_templates', ['id' => $template->id]);
        $this->assertDatabaseHas('clinic_questionnaire_questions', ['id' => $q1->id]);
        $this->assertDatabaseHas('clinic_questionnaire_questions', ['id' => $q2->id]);
        $this->assertDatabaseHas('clinic_patient_questionnaire_answers', [
            'patient_questionnaire_id'  => $sent->id,
            'questionnaire_question_id' => $q1->id,
        ]);

        // Mesmo após arquivar q2 e excluir o template, o questionário respondido continua mostrando q1 e q2.
        $this->actingAs($this->adminA, 'clinic')
            ->getJson("/api/clinic/patients/{$this->patientA->id}/questionnaires/{$sent->id}")
            ->assertOk()
            ->assertJsonPath('data.template.id', $template->id)
            ->assertJsonCount(2, 'data.template.sections.0.questions')
            ->assertJsonCount(2, 'data.answers');

        // A FK restrictOnDelete impede apagar diretamente uma pergunta já respondida.
        $this->expectException(QueryException::class);
        QuestionnaireQuestion::query()->whereKey($q1->id)->delete();
    }

    public function test_answered_questionnaire_does_not_show_questions_or_sections_added_after_it_was_answered(): void
    {
        [$template, $section, $q1, $q2] = $this->createQuestionnaireWithTwoQuestions($this->clinicA->id);

        $answered = PatientQuestionnaire::forceCreate([
            'clinic_id'                 => $this->clinicA->id,
            'patient_id'                => $this->patientA->id,
            'clinic_user_id'            => $this->adminA->id,
            'questionnaire_template_id' => $template->id,
            'modality'                  => 'presencial',
            'status'                    => PatientQuestionnaire::STATUS_ANSWERED,
            'answered_at'               => now(),
        ]);
        PatientQuestionnaireAnswer::forceCreate([
            'patient_questionnaire_id'  => $answered->id,
            'questionnaire_question_id' => $q1->id,
            'answer'                    => 7,
        ]);
        $pending = PatientQuestionnaire::forceCreate([
            'clinic_id'                 => $this->clinicA->id,
            'patient_id'                => $this->patientA->id,
            'clinic_user_id'            => $this->adminA->id,
            'questionnaire_template_id' => $template->id,
            'modality'                  => 'remoto',
            'status'                    => PatientQuestionnaire::STATUS_PENDING,
        ]);

        $this->travel(1)->minutes();

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/questionnaire-templates/{$template->id}", [
                'title'    => $template->title,
                'sections' => [
                    [
                        'id'         => $section->id,
                        'title'      => $section->title,
                        'sort_order' => 0,
                        'questions'  => [
                            ['id' => $q1->id, 'label' => $q1->label, 'type' => $q1->type, 'sort_order' => 0],
                            ['id'    => $q2->id, 'label' => $q2->label, 'type' => $q2->type, 'sort_order' => 1],
                            ['label' => 'Pergunta nova', 'type' => 'text', 'sort_order' => 2],
                        ],
                    ],
                    [
                        'title'      => 'Seção nova',
                        'sort_order' => 1,
                        'questions'  => [
                            ['label' => 'Outra pergunta nova', 'type' => 'text', 'sort_order' => 0],
                        ],
                    ],
                ],
            ])
            ->assertOk();

        // O respondido mostra só o que existia quando o paciente respondeu (q1 respondida, q2 em branco).
        $this->actingAs($this->adminA, 'clinic')
            ->getJson("/api/clinic/patients/{$this->patientA->id}/questionnaires/{$answered->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.template.sections')
            ->assertJsonCount(2, 'data.template.sections.0.questions')
            ->assertJsonPath('data.template.sections.0.questions.0.id', $q1->id)
            ->assertJsonPath('data.template.sections.0.questions.1.id', $q2->id);

        // O pendente mostra o modelo atual, com as perguntas novas.
        $this->actingAs($this->adminA, 'clinic')
            ->getJson("/api/clinic/patients/{$this->patientA->id}/questionnaires/{$pending->id}")
            ->assertOk()
            ->assertJsonCount(2, 'data.template.sections')
            ->assertJsonCount(3, 'data.template.sections.0.questions');
    }

    public function test_section_or_question_id_from_another_questionnaire_or_clinic_returns_422(): void
    {
        [$templateA, $sectionA]             = $this->createQuestionnaireWithTwoQuestions($this->clinicA->id);
        [$templateB, $sectionB, $questionB] = $this->createQuestionnaireWithTwoQuestions($this->clinicB->id);

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/questionnaire-templates/{$templateA->id}", [
                'title'    => 'Tentativa id outra clínica',
                'sections' => [[
                    'id'        => $sectionA->id,
                    'title'     => 'Seção A',
                    'questions' => [[
                        'id'    => $questionB->id,
                        'label' => 'Pergunta invadida',
                        'type'  => 'text',
                    ]],
                ]],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['sections.0.questions.0.id']);

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/questionnaire-templates/{$templateA->id}", [
                'title'    => 'Tentativa seção outra clínica',
                'sections' => [[
                    'id'        => $sectionB->id,
                    'title'     => 'Seção invadida',
                    'questions' => [[
                        'label' => 'Pergunta nova',
                        'type'  => 'text',
                    ]],
                ]],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['sections.0.id']);
    }

    /**
     * @return array{0: QuestionnaireTemplate, 1: QuestionnaireSection, 2: QuestionnaireQuestion, 3: QuestionnaireQuestion}
     */
    private function createQuestionnaireWithTwoQuestions(int $clinicId): array
    {
        $template = QuestionnaireTemplate::forceCreate([
            'clinic_id'   => $clinicId,
            'title'       => 'Questionário de dor',
            'description' => 'Inicial',
            'is_active'   => true,
        ]);
        $section = QuestionnaireSection::forceCreate([
            'questionnaire_template_id' => $template->id,
            'title'                     => 'Dor',
            'sort_order'                => 0,
        ]);
        $q1 = QuestionnaireQuestion::forceCreate([
            'questionnaire_section_id' => $section->id,
            'label'                    => 'Nota da dor',
            'type'                     => 'scale',
            'scale_min'                => 0,
            'scale_max'                => 10,
            'required'                 => true,
            'sort_order'               => 0,
        ]);
        $q2 = QuestionnaireQuestion::forceCreate([
            'questionnaire_section_id' => $section->id,
            'label'                    => 'O que piora?',
            'type'                     => 'text',
            'required'                 => false,
            'sort_order'               => 1,
        ]);

        return [$template, $section, $q1, $q2];
    }
}
