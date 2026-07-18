<?php

namespace Modules\ClinicQuestionnaire\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route as RouteFacade;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;
use Modules\ClinicQuestionnaire\Models\QuestionnaireQuestion;
use Modules\ClinicQuestionnaire\Models\QuestionnaireSection;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PatientQuestionnaireControllerTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $clinicUser;

    private Clinic $clinic;

    private Patient $patient;

    private QuestionnaireTemplate $template;

    protected function setUp(): void
    {
        parent::setUp();
        $this->clinicUser = ClinicUser::factory()->create();
        $this->clinic     = Clinic::find($this->clinicUser->clinic_id);
        $this->patient    = Patient::factory()->forClinic($this->clinic)->create();
        $this->template   = QuestionnaireTemplate::factory()->forClinic($this->clinic)->create();
    }

    public function test_unauthenticated_cannot_list_questionnaires(): void
    {
        $this->getJson("/api/clinic/patients/{$this->patient->id}/questionnaires")
            ->assertUnauthorized();
    }

    public function test_lists_questionnaires_for_own_clinic_patient(): void
    {
        PatientQuestionnaire::factory()
            ->forPatient($this->patient, $this->clinic)
            ->count(3)
            ->create([
                'questionnaire_template_id' => $this->template->id,
            ]);

        $this->actingAs($this->clinicUser, 'clinic')
            ->getJson("/api/clinic/patients/{$this->patient->id}/questionnaires")
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_cannot_list_questionnaires_for_patient_of_another_clinic(): void
    {
        $otherPatient = Patient::factory()->create();

        $this->actingAs($this->clinicUser, 'clinic')
            ->getJson("/api/clinic/patients/{$otherPatient->id}/questionnaires")
            ->assertNotFound();
    }

    public function test_unauthenticated_cannot_create_questionnaire(): void
    {
        $this->postJson("/api/clinic/patients/{$this->patient->id}/questionnaires", [
            'questionnaire_template_id' => $this->template->id,
            'modality'                  => 'presencial',
        ])->assertUnauthorized();
    }

    public function test_store_validates_required_fields(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patient->id}/questionnaires", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['questionnaire_template_id', 'modality']);
    }

    public function test_store_validates_invalid_modality(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patient->id}/questionnaires", [
                'questionnaire_template_id' => $this->template->id,
                'modality'                  => 'invalido',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('modality');
    }

    public function test_store_validates_expires_at_must_be_future(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patient->id}/questionnaires", [
                'questionnaire_template_id' => $this->template->id,
                'modality'                  => 'presencial',
                'expires_at'                => now()->subDay()->toDateTimeString(),
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('expires_at');
    }

    public function test_store_returns_404_for_patient_of_another_clinic(): void
    {
        $otherPatient = Patient::factory()->create();

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$otherPatient->id}/questionnaires", [
                'questionnaire_template_id' => $this->template->id,
                'modality'                  => 'presencial',
            ])->assertNotFound();
    }

    public function test_store_creates_questionnaire_and_returns_201(): void
    {
        $expiresAt = now()->addDays(7)->toDateTimeString();

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patient->id}/questionnaires", [
                'questionnaire_template_id' => $this->template->id,
                'modality'                  => 'remoto',
                'expires_at'                => $expiresAt,
            ])->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.modality', 'remoto')
            ->assertJsonPath('data.questionnaire_template_id', $this->template->id);

        $this->assertDatabaseHas('clinic_patient_questionnaires', [
            'patient_id'                => $this->patient->id,
            'clinic_id'                 => $this->clinicUser->clinic_id,
            'questionnaire_template_id' => $this->template->id,
            'status'                    => 'pending',
            'modality'                  => 'remoto',
        ]);
    }

    public function test_store_accepts_presencial_modality(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patient->id}/questionnaires", [
                'questionnaire_template_id' => $this->template->id,
                'modality'                  => 'presencial',
            ])->assertCreated()
            ->assertJsonPath('data.modality', 'presencial');
    }

    public function test_unauthenticated_cannot_delete_questionnaire(): void
    {
        $questionnaire = $this->createQuestionnaireForPatient();

        $this->deleteJson("/api/clinic/patients/{$this->patient->id}/questionnaires/{$questionnaire->id}")
            ->assertUnauthorized();
    }

    public function test_destroy_soft_deletes_questionnaire(): void
    {
        $questionnaire = $this->createQuestionnaireForPatient();

        $this->actingAs($this->clinicUser, 'clinic')
            ->deleteJson("/api/clinic/patients/{$this->patient->id}/questionnaires/{$questionnaire->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Questionário removido com sucesso.');

        $this->assertSoftDeleted('clinic_patient_questionnaires', ['id' => $questionnaire->id]);
    }

    public function test_cannot_destroy_questionnaire_of_another_clinic(): void
    {
        $otherClinicUser    = ClinicUser::factory()->create();
        $otherClinic        = Clinic::find($otherClinicUser->clinic_id);
        $otherPatient       = Patient::factory()->forClinic($otherClinic)->create();
        $otherQuestionnaire = $this->createQuestionnaireForPatient($otherPatient, $otherClinic);

        $this->actingAs($this->clinicUser, 'clinic')
            ->deleteJson("/api/clinic/patients/{$otherPatient->id}/questionnaires/{$otherQuestionnaire->id}")
            ->assertNotFound();
    }

    public function test_clinic_can_answer_presencial_questionnaire(): void
    {
        $section = QuestionnaireSection::query()->create([
            'questionnaire_template_id' => $this->template->id,
            'title'                     => 'Anamnese',
            'sort_order'                => 0,
        ]);
        $question = QuestionnaireQuestion::query()->create([
            'questionnaire_section_id' => $section->id,
            'label'                    => 'Qual a queixa?',
            'type'                     => 'text',
            'options'                  => null,
            'scale_min'                => 0,
            'scale_max'                => 10,
            'required'                 => true,
            'sort_order'               => 0,
        ]);

        $questionnaire = PatientQuestionnaire::factory()
            ->forPatient($this->patient, $this->clinic)
            ->create([
                'questionnaire_template_id' => $this->template->id,
                'modality'                  => 'presencial',
                'status'                    => 'pending',
            ]);

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patient->id}/questionnaires/{$questionnaire->id}/answer", [
                'answers' => [
                    ['question_id' => $question->id, 'answer' => 'Dor lombar'],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'answered');
    }

    public function test_clinic_cannot_answer_remoto_questionnaire(): void
    {
        $section = QuestionnaireSection::query()->create([
            'questionnaire_template_id' => $this->template->id,
            'title'                     => 'Anamnese',
            'sort_order'                => 0,
        ]);
        $question = QuestionnaireQuestion::query()->create([
            'questionnaire_section_id' => $section->id,
            'label'                    => 'Qual a queixa?',
            'type'                     => 'text',
            'options'                  => null,
            'scale_min'                => 0,
            'scale_max'                => 10,
            'required'                 => true,
            'sort_order'               => 0,
        ]);

        $questionnaire = PatientQuestionnaire::factory()
            ->forPatient($this->patient, $this->clinic)
            ->create([
                'questionnaire_template_id' => $this->template->id,
                'modality'                  => 'remoto',
                'status'                    => 'pending',
            ]);

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patient->id}/questionnaires/{$questionnaire->id}/answer", [
                'answers' => [
                    ['question_id' => $question->id, 'answer' => 'Dor lombar'],
                ],
            ])
            ->assertStatus(422);
    }

    private function createQuestionnaireForPatient(?Patient $patient = null, ?Clinic $clinic = null): PatientQuestionnaire
    {
        $patient = $patient ?? $this->patient;
        $clinic  = $clinic ?? $this->clinic;

        return PatientQuestionnaire::factory()->forPatient($patient, $clinic)->create();
    }
}

class ClinicQuestionnaireRouteCompatibilityTest extends TestCase
{
    public function test_clinic_questionnaire_route_paths_and_methods_remain_compatible(): void
    {
        $routes = $this->questionnaireRouteMethodsByUri();

        $this->assertSame(array_keys($this->expectedMethodsByUri()), array_keys($routes));

        foreach ($this->expectedMethodsByUri() as $uri => $methods) {
            sort($methods);
            $this->assertSame($methods, $routes[$uri]['methods'], "Unexpected methods for {$uri}");

            foreach ($routes[$uri]['owners'] as $owner) {
                $this->assertStringStartsWith(
                    'Modules\\ClinicQuestionnaire\\Http\\Controllers\\',
                    $owner,
                    "Unexpected route owner for {$uri}",
                );
            }
        }
    }

    protected function questionnaireRouteMethodsByUri(): array
    {
        $routes = [];

        foreach (RouteFacade::getRoutes() as $route) {
            if (!str_starts_with($route->uri(), 'api/clinic/') && !str_starts_with($route->uri(), 'api/questionnaires')) {
                continue;
            }

            if (
                !str_contains($route->uri(), 'questionnaire')
                && !str_starts_with($route->uri(), 'api/questionnaires')
            ) {
                continue;
            }

            $routes[$route->uri()] ??= ['methods' => [], 'owners' => []];
            $routes[$route->uri()]['methods'] = array_values(array_unique(array_merge(
                $routes[$route->uri()]['methods'],
                $route->methods(),
            )));
            $routes[$route->uri()]['owners'][] = $route->getActionName();
        }

        foreach ($routes as $uri => $route) {
            sort($route['methods']);
            sort($route['owners']);
            $routes[$uri] = $route;
        }

        ksort($routes);

        return $routes;
    }

    protected function expectedMethodsByUri(): array
    {
        return [
            'api/clinic/patients/{patient}/questionnaires'                          => ['GET', 'HEAD', 'POST'],
            'api/clinic/patients/{patient}/questionnaires/{questionnaire}'          => ['DELETE', 'GET', 'HEAD'],
            'api/clinic/patients/{patient}/questionnaires/{questionnaire}/answer'   => ['POST'],
            'api/clinic/questionnaire-templates'                                    => ['GET', 'HEAD', 'POST'],
            'api/clinic/questionnaire-templates/{id}'                               => ['DELETE', 'GET', 'HEAD', 'PUT'],
            'api/questionnaires/{id}'                                               => ['GET', 'HEAD'],
            'api/questionnaires/{id}/answer'                                        => ['POST'],
        ];
    }
}
