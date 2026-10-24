<?php

namespace Modules\ClinicQuestionnaire\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicQuestionnaire\Database\BackfillPatientQuestionnairePublicTokens;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;
use Modules\ClinicQuestionnaire\Models\QuestionnaireQuestion;
use Modules\ClinicQuestionnaire\Models\QuestionnaireSection;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PublicQuestionnaireTokenTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $clinicUser;

    private Patient $patient;

    private QuestionnaireTemplate $template;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinicUser = ClinicUser::factory()->create();
        $this->clinic     = Clinic::find($this->clinicUser->clinic_id);
        $this->clinic->forceFill(['slug' => 'clinica-token'])->save();
        $this->patient  = Patient::factory()->forClinic($this->clinic)->create();
        $this->template = QuestionnaireTemplate::factory()->forClinic($this->clinic)->create();
    }

    public function test_public_get_by_numeric_id_returns_404(): void
    {
        $questionnaire = PatientQuestionnaire::factory()
            ->forPatient($this->patient, $this->clinic)
            ->create([
                'questionnaire_template_id' => $this->template->id,
                'modality'                  => PatientQuestionnaire::MODALITY_REMOTO,
                'status'                    => PatientQuestionnaire::STATUS_PENDING,
            ]);

        $this->getJson("/api/questionnaires/{$questionnaire->id}")
            ->assertNotFound();
    }

    public function test_public_get_by_token_returns_pending_questionnaire(): void
    {
        $section = QuestionnaireSection::query()->create([
            'questionnaire_template_id' => $this->template->id,
            'title'                     => 'Anamnese',
            'sort_order'                => 0,
        ]);
        QuestionnaireQuestion::query()->create([
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
                'modality'                  => PatientQuestionnaire::MODALITY_REMOTO,
                'status'                    => PatientQuestionnaire::STATUS_PENDING,
            ]);

        $response = $this->getJson("/api/questionnaires/{$questionnaire->public_token}")
            ->assertOk()
            ->assertJsonPath('data.id', $questionnaire->id)
            ->assertJsonPath('data.status', PatientQuestionnaire::STATUS_PENDING)
            ->assertJsonPath('data.template.id', $this->template->id)
            ->assertJsonMissingPath('data.clinic_user')
            ->assertJsonMissingPath('data.clinic_user_id');

        $this->assertArrayNotHasKey('email', $response->json('data') ?? []);
        $this->assertArrayNotHasKey('document', $response->json('data') ?? []);
    }

    public function test_public_get_unknown_token_returns_404(): void
    {
        $this->getJson('/api/questionnaires/00000000-0000-0000-0000-000000000000')
            ->assertNotFound();
    }

    public function test_store_returns_public_token_and_share_url(): void
    {
        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patient->id}/questionnaires", [
                'questionnaire_template_id' => $this->template->id,
                'modality'                  => 'remoto',
                'expires_at'                => now()->addDays(7)->toDateTimeString(),
            ])
            ->assertCreated()
            ->assertJsonMissingPath('data.clinic');

        $token = $response->json('data.public_token');
        $this->assertTrue(Str::isUuid((string) $token));
        $response->assertJsonPath(
            'data.share_url',
            rtrim((string) config('app.url'), '/')
            . '/clinica-token/paciente/questionarios/'
            . $token,
        );
    }

    public function test_show_and_list_include_public_token_and_share_url(): void
    {
        $questionnaire = PatientQuestionnaire::factory()
            ->forPatient($this->patient, $this->clinic)
            ->create([
                'questionnaire_template_id' => $this->template->id,
                'modality'                  => PatientQuestionnaire::MODALITY_REMOTO,
            ]);

        $expectedUrl = rtrim((string) config('app.url'), '/')
            . '/clinica-token/paciente/questionarios/'
            . $questionnaire->public_token;

        $this->actingAs($this->clinicUser, 'clinic')
            ->getJson("/api/clinic/patients/{$this->patient->id}/questionnaires/{$questionnaire->id}")
            ->assertOk()
            ->assertJsonPath('data.public_token', $questionnaire->public_token)
            ->assertJsonPath('data.share_url', $expectedUrl);

        $this->actingAs($this->clinicUser, 'clinic')
            ->getJson("/api/clinic/patients/{$this->patient->id}/questionnaires")
            ->assertOk()
            ->assertJsonPath('data.0.public_token', $questionnaire->public_token)
            ->assertJsonPath('data.0.share_url', $expectedUrl);
    }

    public function test_migration_backfills_public_token_on_existing_rows(): void
    {
        $this->assertTrue(Schema::hasColumn('clinic_patient_questionnaires', 'public_token'));

        $questionnaire = PatientQuestionnaire::factory()
            ->forPatient($this->patient, $this->clinic)
            ->create([
                'questionnaire_template_id' => $this->template->id,
            ]);

        DB::table('clinic_patient_questionnaires')
            ->where('id', $questionnaire->id)
            ->update(['public_token' => null]);

        $updated = (new BackfillPatientQuestionnairePublicTokens)();

        $this->assertSame(1, $updated);
        $token = DB::table('clinic_patient_questionnaires')
            ->where('id', $questionnaire->id)
            ->value('public_token');
        $this->assertTrue(Str::isUuid((string) $token));
    }
}
