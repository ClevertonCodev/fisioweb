<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Mockery\MockInterface;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\PatientFile;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PatientFileControllerTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $clinicUser;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->clinicUser = ClinicUser::factory()->create();
        $this->patient    = Patient::factory()->forClinic(
            Clinic::find($this->clinicUser->clinic_id)
        )->create();
    }

    // ─── index ────────────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_list_files(): void
    {
        $this->getJson("/api/clinic/patients/{$this->patient->id}/files")
            ->assertUnauthorized();
    }

    public function test_lists_files_for_own_clinic_patient(): void
    {
        PatientFile::factory()->forPatient($this->patient, Clinic::find($this->clinicUser->clinic_id))->count(3)->create();

        $this->actingAs($this->clinicUser, 'clinic')
            ->getJson("/api/clinic/patients/{$this->patient->id}/files")
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_cannot_list_files_for_patient_of_another_clinic(): void
    {
        $otherPatient = Patient::factory()->create();

        $this->actingAs($this->clinicUser, 'clinic')
            ->getJson("/api/clinic/patients/{$otherPatient->id}/files")
            ->assertNotFound();
    }

    // ─── store ────────────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_upload_file(): void
    {
        $this->postJson("/api/clinic/patients/{$this->patient->id}/files", [
            'file' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
        ])->assertUnauthorized();
    }

    public function test_upload_requires_file(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patient->id}/files", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    }

    public function test_upload_rejects_oversized_file(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patient->id}/files", [
                'file' => UploadedFile::fake()->create('big.pdf', 20481, 'application/pdf'),
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    }

    public function test_upload_rejects_invalid_mime(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patient->id}/files", [
                'file' => UploadedFile::fake()->create('virus.exe', 100, 'application/x-msdownload'),
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    }

    public function test_upload_returns404_for_patient_of_another_clinic(): void
    {
        $otherPatient = Patient::factory()->create();

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$otherPatient->id}/files", [
                'file' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
            ])->assertNotFound();
    }

    public function test_upload_stores_file_and_returns_201(): void
    {
        Storage::fake('r2');

        $cdnUrl = 'https://cdn.example.com/patients/files/arquivo.pdf';

        $this->mock(FileServiceInterface::class, function (MockInterface $mock) use ($cdnUrl) {
            $mock->shouldReceive('uploadFile')
                ->once()
                ->andReturn([
                    'cdn_url'           => $cdnUrl,
                    'url'               => 'https://r2.example.com/patients/files/arquivo.pdf',
                    'filename'          => 'arquivo.pdf',
                    'original_filename' => 'meu-arquivo.pdf',
                    'path'              => 'patients/files/arquivo.pdf',
                    'mime_type'         => 'application/pdf',
                    'size'              => 204800,
                ]);
        });

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patient->id}/files", [
                'file' => UploadedFile::fake()->create('meu-arquivo.pdf', 200, 'application/pdf'),
            ])->assertCreated()
            ->assertJsonPath('data.cdn_url', $cdnUrl)
            ->assertJsonPath('data.original_name', 'meu-arquivo.pdf');

        $this->assertDatabaseHas('clinic_patient_files', [
            'patient_id' => $this->patient->id,
            'clinic_id'  => $this->clinicUser->clinic_id,
            'cdn_url'    => $cdnUrl,
        ]);
    }

    public function test_upload_accepts_jpeg_png_and_docx(): void
    {
        Storage::fake('r2');

        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('uploadFile')->andReturn([
                'cdn_url'           => 'https://cdn.example.com/file.png',
                'url'               => 'https://r2.example.com/file.png',
                'filename'          => 'file.png',
                'original_filename' => 'foto.png',
                'path'              => 'patients/files/file.png',
                'mime_type'         => 'image/png',
                'size'              => 51200,
            ]);
        });

        $types = [
            ['foto.jpg', 'image/jpeg'],
            ['foto.png', 'image/png'],
        ];

        foreach ($types as [$name, $mime]) {
            $this->actingAs($this->clinicUser, 'clinic')
                ->postJson("/api/clinic/patients/{$this->patient->id}/files", [
                    'file' => UploadedFile::fake()->create($name, 100, $mime),
                ])->assertCreated();
        }
    }

    // ─── destroy ──────────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_delete_file(): void
    {
        $file = $this->createFileForPatient();

        $this->deleteJson("/api/clinic/patients/{$this->patient->id}/files/{$file->id}")
            ->assertUnauthorized();
    }

    public function test_destroy_soft_deletes_file(): void
    {
        $file = $this->createFileForPatient();

        $this->actingAs($this->clinicUser, 'clinic')
            ->deleteJson("/api/clinic/patients/{$this->patient->id}/files/{$file->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Arquivo removido com sucesso.');

        $this->assertSoftDeleted('clinic_patient_files', ['id' => $file->id]);
    }

    public function test_cannot_destroy_file_of_another_clinic(): void
    {
        $otherClinicUser = ClinicUser::factory()->create();
        $otherPatient    = Patient::factory()->forClinic(Clinic::find($otherClinicUser->clinic_id))->create();
        $otherFile       = $this->createFileForPatient($otherPatient, Clinic::find($otherClinicUser->clinic_id));

        $this->actingAs($this->clinicUser, 'clinic')
            ->deleteJson("/api/clinic/patients/{$otherPatient->id}/files/{$otherFile->id}")
            ->assertNotFound();
    }

    // ─── helpers ──────────────────────────────────────────────────────────────

    private function createFileForPatient(?Patient $patient = null, ?Clinic $clinic = null): PatientFile
    {
        $patient = $patient ?? $this->patient;
        $clinic  = $clinic ?? Clinic::find($this->clinicUser->clinic_id);

        return PatientFile::factory()->forPatient($patient, $clinic)->create();
    }
}
