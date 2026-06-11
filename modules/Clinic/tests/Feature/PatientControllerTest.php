<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Mockery\MockInterface;
use Modules\Clinic\Models\ClinicUser;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PatientControllerTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $clinicUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->clinicUser = ClinicUser::factory()->create();
    }

    public function test_unauthenticated_cannot_create_patient(): void
    {
        $this->postJson('/api/clinic/patients', $this->validPayload())
            ->assertUnauthorized();
    }

    public function test_creates_patient_with_required_fields(): void
    {
        $payload = $this->validPayload();

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/patients', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.name', $payload['name']);

        $this->assertDatabaseHas('patients', [
            'email'          => $payload['email'],
            'clinic_id'      => $this->clinicUser->clinic_id,
            'clinic_user_id' => $this->clinicUser->id,
        ]);
    }

    public function test_created_patient_response_includes_clinic_user(): void
    {
        $payload = $this->validPayload();

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/patients', $payload)
            ->assertCreated()
            ->assertJsonPath('data.clinic_user.id', $this->clinicUser->id)
            ->assertJsonPath('data.clinic_user.name', $this->clinicUser->name);
    }

    public function test_index_includes_clinic_user_on_each_patient(): void
    {
        $patient = Patient::factory()->forClinic(
            \Modules\Clinic\Models\Clinic::find($this->clinicUser->clinic_id)
        )->create([
            'clinic_user_id' => $this->clinicUser->id,
            'name'           => 'Paciente Listagem',
        ]);

        $this->actingAs($this->clinicUser, 'clinic')
            ->getJson('/api/clinic/patients?search=Paciente Listagem')
            ->assertOk()
            ->assertJsonPath('data.data.0.id', $patient->id)
            ->assertJsonPath('data.data.0.clinic_user.id', $this->clinicUser->id)
            ->assertJsonPath('data.data.0.clinic_user.name', $this->clinicUser->name);
    }

    public function test_index_filters_by_professional_ids(): void
    {
        $otherProfessional = ClinicUser::factory()->create([
            'clinic_id' => $this->clinicUser->clinic_id,
        ]);

        $mine = Patient::factory()->forClinic(
            \Modules\Clinic\Models\Clinic::find($this->clinicUser->clinic_id)
        )->create([
            'clinic_user_id' => $this->clinicUser->id,
            'name'           => 'Paciente Meu Profissional',
        ]);

        Patient::factory()->forClinic(
            \Modules\Clinic\Models\Clinic::find($this->clinicUser->clinic_id)
        )->create([
            'clinic_user_id' => $otherProfessional->id,
            'name'           => 'Paciente Outro Profissional',
        ]);

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->getJson('/api/clinic/patients?professional_ids=' . $this->clinicUser->id);

        $response->assertOk();

        $ids = collect($response->json('data.data'))->pluck('id')->all();

        $this->assertContains($mine->id, $ids);
        $this->assertNotContains(
            Patient::where('name', 'Paciente Outro Profissional')->value('id'),
            $ids
        );
    }

    public function test_created_patient_has_clinic_id_set(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/patients', $this->validPayload())
            ->assertCreated();

        $patient = Patient::where('email', $this->validPayload()['email'])->first();

        $this->assertNotNull($patient);
        $this->assertEquals($this->clinicUser->clinic_id, $patient->clinic_id);
    }

    public function test_cpf_is_used_as_default_password(): void
    {
        $cpf     = '11144477735';
        $payload = $this->validPayload(['cpf' => $cpf]);

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/patients', $payload)
            ->assertCreated();

        $patient = Patient::where('email', $payload['email'])->first();

        $this->assertTrue(\Illuminate\Support\Facades\Hash::check($cpf, $patient->password));
    }

    public function test_same_cpf_can_exist_in_two_different_clinics(): void
    {
        $cpf          = '11144477735';
        $secondClinic = ClinicUser::factory()->create();

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/patients', $this->validPayload(['cpf' => $cpf]))
            ->assertCreated();

        $this->actingAs($secondClinic, 'clinic')
            ->postJson('/api/clinic/patients', $this->validPayload(['cpf' => $cpf, 'email' => 'outro@exemplo.com']))
            ->assertCreated();

        $this->assertDatabaseCount('patients', 2);
    }

    public function test_duplicate_cpf_in_same_clinic_is_rejected(): void
    {
        $cpf = '11144477735';

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/patients', $this->validPayload(['cpf' => $cpf]))
            ->assertCreated();

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/patients', $this->validPayload(['cpf' => $cpf, 'email' => 'outro@exemplo.com']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cpf');
    }

    public function test_cpf_not_required_when_is_foreign(): void
    {
        $payload = $this->validPayload([
            'is_foreign' => true,
            'cpf'        => 'A12345678',
        ]);

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/patients', $payload)
            ->assertCreated();
    }

    public function test_name_is_required(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/patients', $this->validPayload(['name' => '']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_phone_is_required(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/patients', $this->validPayload(['phone' => '']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('phone');
    }

    public function test_birth_date_is_required(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/patients', $this->validPayload(['birth_date' => '']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('birth_date');
    }

    public function test_email_is_required(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/patients', $this->validPayload(['email' => '']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_email_must_be_valid(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/patients', $this->validPayload(['email' => 'nao-e-email']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_cpf_required_when_not_foreign(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/patients', $this->validPayload(['cpf' => '', 'is_foreign' => false]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cpf');
    }

    public function test_birth_date_must_be_valid_date(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/patients', $this->validPayload(['birth_date' => 'nao-e-data']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('birth_date');
    }

    public function test_destroy_soft_deletes_patient(): void
    {
        $patient = $this->createPatientForClinic();

        $this->actingAs($this->clinicUser, 'clinic')
            ->deleteJson("/api/clinic/patients/{$patient->id}")
            ->assertOk();

        $this->assertSoftDeleted('patients', ['id' => $patient->id]);
    }

    public function test_destroy_returns404_for_patient_of_another_clinic(): void
    {
        $other = Patient::factory()->create();

        $this->actingAs($this->clinicUser, 'clinic')
            ->deleteJson("/api/clinic/patients/{$other->id}")
            ->assertNotFound();
    }

    // ─── uploadPhoto ─────────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_upload_photo(): void
    {
        $patient = $this->createPatientForClinic();

        $this->postJson("/api/clinic/patients/{$patient->id}/photo", [
            'photo' => UploadedFile::fake()->create('photo.jpg', 100, 'image/jpeg'),
        ])->assertUnauthorized();
    }

    public function test_upload_photo_returns404_for_patient_not_linked_to_clinic(): void
    {
        $otherPatient = Patient::factory()->create();

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$otherPatient->id}/photo", [
                'photo' => UploadedFile::fake()->create('photo.jpg', 100, 'image/jpeg'),
            ])->assertNotFound();
    }

    public function test_upload_photo_requires_file(): void
    {
        $patient = $this->createPatientForClinic();

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$patient->id}/photo", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('photo');
    }

    public function test_upload_photo_rejects_non_image_file(): void
    {
        $patient = $this->createPatientForClinic();

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$patient->id}/photo", [
                'photo' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('photo');
    }

    public function test_upload_photo_rejects_files_over2_mb(): void
    {
        $patient = $this->createPatientForClinic();

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$patient->id}/photo", [
                'photo' => UploadedFile::fake()->create('big.jpg', 2049, 'image/jpeg'),
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('photo');
    }

    public function test_upload_photo_stores_cdn_url_on_patient(): void
    {
        Storage::fake('r2');
        $patient = $this->createPatientForClinic();
        $cdnUrl  = 'https://cdn.example.com/patients/photos/photo.jpg';

        $this->mock(FileServiceInterface::class, function (MockInterface $mock) use ($cdnUrl) {
            $mock->shouldReceive('uploadFile')
                ->once()
                ->andReturn([
                    'cdn_url'           => $cdnUrl,
                    'url'               => 'https://r2.example.com/patients/photos/photo.jpg',
                    'filename'          => 'photo.jpg',
                    'original_filename' => 'my-photo.jpg',
                    'path'              => 'patients/photos/photo.jpg',
                    'mime_type'         => 'image/jpeg',
                    'size'              => 1024,
                ]);
        });

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$patient->id}/photo", [
                'photo' => UploadedFile::fake()->create('my-photo.jpg', 100, 'image/jpeg'),
            ])->assertOk()
            ->assertJsonPath('data.photo_url', $cdnUrl);

        $this->assertDatabaseHas('patients', [
            'id'        => $patient->id,
            'photo_url' => $cdnUrl,
        ]);
    }

    public function test_upload_photo_accepts_jpeg_png_and_webp(): void
    {
        Storage::fake('r2');
        $patient = $this->createPatientForClinic();

        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('uploadFile')->andReturn([
                'cdn_url'           => 'https://cdn.example.com/photo.png',
                'url'               => 'https://r2.example.com/photo.png',
                'filename'          => 'photo.png',
                'original_filename' => 'photo.png',
                'path'              => 'patients/photos/photo.png',
                'mime_type'         => 'image/png',
                'size'              => 512,
            ]);
        });

        $mimes = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];

        foreach ($mimes as $ext => $mime) {
            $this->actingAs($this->clinicUser, 'clinic')
                ->postJson("/api/clinic/patients/{$patient->id}/photo", [
                    'photo' => UploadedFile::fake()->create("photo.{$ext}", 100, $mime),
                ])->assertOk();
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private function createPatientForClinic(): Patient
    {
        return Patient::factory()->forClinic(
            \Modules\Clinic\Models\Clinic::find($this->clinicUser->clinic_id)
        )->create();
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name'       => 'João Silva Santos',
            'email'      => 'joao@exemplo.com',
            'cpf'        => '11144477735',
            'phone'      => '21987654321',
            'birth_date' => '1990-07-20',
            'is_foreign' => false,
            'status'     => 'em_tratamento',
        ], $overrides);
    }
}
