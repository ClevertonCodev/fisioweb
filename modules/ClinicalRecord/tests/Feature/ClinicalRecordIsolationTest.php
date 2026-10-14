<?php

namespace Modules\ClinicalRecord\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicalRecord\Models\Assessment;
use Modules\ClinicalRecord\Models\EvolutionTemplate;
use Modules\ClinicalRecord\Models\PatientEvolution;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class ClinicalRecordIsolationTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $adminA;

    private ClinicUser $physioA;

    private ClinicUser $adminB;

    private Patient $patientA;

    private int $adminTemplateId;

    private Assessment $assessmentA;

    private PatientEvolution $evolutionA;

    private EvolutionTemplate $templateA;

    private EvolutionTemplate $systemTemplate;

    protected function setUp(): void
    {
        parent::setUp();

        $clinicA       = Clinic::factory()->create();
        $clinicB       = Clinic::factory()->create();
        $this->adminA  = ClinicUser::factory()->create(['clinic_id' => $clinicA->id]);
        $this->physioA = ClinicUser::factory()->create(['clinic_id' => $clinicA->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->adminB  = ClinicUser::factory()->create(['clinic_id' => $clinicB->id]);

        $this->patientA = Patient::factory()->create(['clinic_id' => $clinicA->id, 'clinic_user_id' => $this->adminA->id]);

        $this->adminTemplateId = DB::table('admin_assessment_templates')->insertGetId([
            'name'       => 'Avaliação padrão',
            'is_active'  => true,
            'sort_order' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assessmentA = Assessment::forceCreate([
            'clinic_id'                    => $clinicA->id,
            'patient_id'                   => $this->patientA->id,
            'clinic_user_id'               => $this->physioA->id,
            'admin_assessment_template_id' => $this->adminTemplateId,
            'status'                       => 'draft',
        ]);

        $this->evolutionA = PatientEvolution::forceCreate([
            'clinic_id'      => $clinicA->id,
            'patient_id'     => $this->patientA->id,
            'clinic_user_id' => $this->physioA->id,
            'title'          => 'Evolução da clínica A',
            'status'         => 'draft',
        ]);

        $this->templateA = EvolutionTemplate::forceCreate([
            'clinic_id' => $clinicA->id,
            'name'      => 'Modelo próprio A',
            'is_system' => false,
        ]);

        $this->systemTemplate = EvolutionTemplate::forceCreate([
            'clinic_id' => null,
            'name'      => 'Modelo do sistema',
            'is_system' => true,
        ]);
    }

    public function test_own_assessments_can_be_listed_created_read_updated_signed_and_deleted(): void
    {
        $this->actingAs($this->adminA, 'clinic')
            ->getJson("/api/clinic/patients/{$this->patientA->id}/assessments")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $created = $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/assessments", ['admin_assessment_template_id' => $this->adminTemplateId])
            ->assertCreated()
            ->json('data.id');
        $this->assertDatabaseHas('clinic_assessments', ['id' => $created, 'clinic_id' => $this->patientA->clinic_id, 'clinic_user_id' => $this->adminA->id]);

        $id = $this->assessmentA->id;
        $this->actingAs($this->adminA, 'clinic')->getJson("/api/clinic/assessments/{$id}")->assertOk()->assertJsonPath('data.id', $id);
        $this->actingAs($this->adminA, 'clinic')->putJson("/api/clinic/assessments/{$id}", [])->assertOk();

        // Assinatura registra quem assinou (o autor original era o fisioterapeuta).
        $this->actingAs($this->adminA, 'clinic')->postJson("/api/clinic/assessments/{$id}/sign")->assertOk();
        $this->assertDatabaseHas('clinic_assessments', ['id' => $id, 'status' => 'signed', 'clinic_user_id' => $this->adminA->id]);

        $this->actingAs($this->adminA, 'clinic')->deleteJson("/api/clinic/assessments/{$created}")->assertOk();
        $this->assertSoftDeleted('clinic_assessments', ['id' => $created]);
    }

    public function test_own_evolutions_can_be_listed_created_read_updated_generated_downloaded_signed_and_deleted(): void
    {
        $this->actingAs($this->adminA, 'clinic')
            ->getJson("/api/clinic/patients/{$this->patientA->id}/evolutions")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $created = $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/evolutions", ['title' => 'Nova evolução A'])
            ->assertCreated()
            ->json('data.id');
        $this->assertDatabaseHas('clinic_patient_evolutions', ['id' => $created, 'clinic_id' => $this->patientA->clinic_id, 'clinic_user_id' => $this->adminA->id]);

        $id = $this->evolutionA->id;
        $this->actingAs($this->adminA, 'clinic')->getJson("/api/clinic/evolutions/{$id}")->assertOk()->assertJsonPath('data.id', $id);
        $this->actingAs($this->adminA, 'clinic')->putJson("/api/clinic/evolutions/{$id}", ['title' => 'Evolução editada'])->assertOk();
        $this->actingAs($this->adminA, 'clinic')->postJson("/api/clinic/evolutions/{$id}/generate-text")->assertOk();
        $this->actingAs($this->adminA, 'clinic')->get("/api/clinic/evolutions/{$id}/pdf")->assertOk();

        $this->actingAs($this->adminA, 'clinic')->postJson("/api/clinic/evolutions/{$id}/sign")->assertOk();
        $this->assertDatabaseHas('clinic_patient_evolutions', ['id' => $id, 'status' => 'signed', 'clinic_user_id' => $this->adminA->id]);

        $this->actingAs($this->adminA, 'clinic')->deleteJson("/api/clinic/evolutions/{$created}")->assertOk();
        $this->assertSoftDeleted('clinic_patient_evolutions', ['id' => $created]);
    }

    public function test_own_evolution_templates_can_be_listed_created_read_updated_and_deleted(): void
    {
        $names = collect($this->actingAs($this->adminA, 'clinic')
            ->getJson('/api/clinic/evolution-templates')
            ->assertOk()
            ->json('data'))->pluck('name');
        $this->assertContains('Modelo próprio A', $names);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson('/api/clinic/evolution-templates', ['name' => 'Novo modelo A', 'sections' => $this->templateSections()])
            ->assertCreated();
        $this->assertDatabaseHas('clinic_evolution_templates', ['name' => 'Novo modelo A', 'clinic_id' => $this->patientA->clinic_id]);

        $id = $this->templateA->id;
        $this->actingAs($this->adminA, 'clinic')->getJson("/api/clinic/evolution-templates/{$id}")->assertOk()->assertJsonPath('data.id', $id);
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/evolution-templates/{$id}", ['name' => 'Modelo A editado', 'sections' => $this->templateSections()])
            ->assertOk();
        $this->assertDatabaseHas('clinic_evolution_templates', ['id' => $id, 'name' => 'Modelo A editado']);

        $this->actingAs($this->adminA, 'clinic')->deleteJson("/api/clinic/evolution-templates/{$id}")->assertOk();
        $this->assertDatabaseMissing('clinic_evolution_templates', ['id' => $id]);
    }

    public function test_file_upload_records_authenticated_user_as_uploader(): void
    {
        // Pré-condição: id do usuário ≠ id da clínica, para que trocar um pelo outro seja detectável.
        $this->assertNotSame($this->patientA->clinic_id, $this->physioA->id);

        $this->mock(FileServiceInterface::class, function ($mock) {
            $mock->shouldReceive('uploadFile')->once()->andReturn([
                'cdn_url'           => 'https://cdn.example.com/patients/files/laudo.pdf',
                'url'               => 'https://r2.example.com/patients/files/laudo.pdf',
                'filename'          => 'laudo.pdf',
                'original_filename' => 'laudo.pdf',
                'path'              => 'patients/files/laudo.pdf',
                'mime_type'         => 'application/pdf',
                'size'              => 1024,
            ]);
        });

        $id = $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/files", [
                'file' => UploadedFile::fake()->create('laudo.pdf', 1, 'application/pdf'),
            ])
            ->assertCreated()
            ->json('data.id');

        $this->assertDatabaseHas('clinic_patient_files', [
            'id'             => $id,
            'clinic_id'      => $this->patientA->clinic_id,
            'clinic_user_id' => $this->physioA->id,
        ]);
    }

    private function templateSections(): array
    {
        return [[
            'title'      => 'Seção',
            'sort_order' => 0,
            'items'      => [['label' => 'Item', 'print_text' => 'Texto', 'sort_order' => 0]],
        ]];
    }

    public function test_patient_scoped_records_of_another_clinic_are_not_found(): void
    {
        $patient = $this->patientA->id;

        foreach (['assessments', 'evolutions'] as $resource) {
            $this->actingAs($this->adminB, 'clinic')
                ->getJson("/api/clinic/patients/{$patient}/{$resource}")
                ->assertNotFound()
                ->assertJsonPath('message', 'Paciente não encontrado.');
        }

        $this->actingAs($this->adminB, 'clinic')
            ->postJson("/api/clinic/patients/{$patient}/assessments", ['admin_assessment_template_id' => $this->adminTemplateId])
            ->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')
            ->postJson("/api/clinic/patients/{$patient}/evolutions", ['title' => 'Criada por B'])
            ->assertNotFound();

        $this->assertSame(1, Assessment::count());
        $this->assertSame(1, PatientEvolution::count());
    }

    public function test_assessment_of_another_clinic_cannot_be_read_changed_signed_or_deleted(): void
    {
        $id = $this->assessmentA->id;

        $this->actingAs($this->adminB, 'clinic')->getJson("/api/clinic/assessments/{$id}")->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')->putJson("/api/clinic/assessments/{$id}", [])->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')->postJson("/api/clinic/assessments/{$id}/sign")->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')->deleteJson("/api/clinic/assessments/{$id}")->assertNotFound();

        $this->assertDatabaseHas('clinic_assessments', ['id' => $id, 'status' => 'draft', 'signed_at' => null, 'deleted_at' => null]);
    }

    public function test_evolution_of_another_clinic_cannot_be_read_changed_signed_generated_downloaded_or_deleted(): void
    {
        $id = $this->evolutionA->id;

        $this->actingAs($this->adminB, 'clinic')->getJson("/api/clinic/evolutions/{$id}")->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')->putJson("/api/clinic/evolutions/{$id}", ['title' => 'Alterada por B'])->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')->postJson("/api/clinic/evolutions/{$id}/sign")->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')->postJson("/api/clinic/evolutions/{$id}/generate-text")->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')->getJson("/api/clinic/evolutions/{$id}/pdf")->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')->deleteJson("/api/clinic/evolutions/{$id}")->assertNotFound();

        $this->assertDatabaseHas('clinic_patient_evolutions', [
            'id'         => $id,
            'title'      => 'Evolução da clínica A',
            'status'     => 'draft',
            'signed_at'  => null,
            'deleted_at' => null,
        ]);
    }

    public function test_evolution_templates_of_another_clinic_are_hidden_but_system_templates_are_shared(): void
    {
        $names = collect($this->actingAs($this->adminB, 'clinic')
            ->getJson('/api/clinic/evolution-templates')
            ->assertOk()
            ->json('data'))->pluck('name');
        $this->assertContains('Modelo do sistema', $names);
        $this->assertNotContains('Modelo próprio A', $names);

        $this->actingAs($this->adminB, 'clinic')->getJson("/api/clinic/evolution-templates/{$this->systemTemplate->id}")->assertOk();
        $this->actingAs($this->adminB, 'clinic')->getJson("/api/clinic/evolution-templates/{$this->templateA->id}")->assertNotFound();

        $this->actingAs($this->adminB, 'clinic')
            ->putJson("/api/clinic/evolution-templates/{$this->templateA->id}", [
                'name'     => 'Alterado por B',
                'sections' => [[
                    'title'      => 'Seção',
                    'sort_order' => 0,
                    'items'      => [['label' => 'Item', 'print_text' => 'Texto', 'sort_order' => 0]],
                ]],
            ])
            ->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')->deleteJson("/api/clinic/evolution-templates/{$this->templateA->id}")->assertNotFound();

        $this->assertDatabaseHas('clinic_evolution_templates', ['id' => $this->templateA->id, 'name' => 'Modelo próprio A']);
    }
}
