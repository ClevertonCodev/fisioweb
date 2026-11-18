<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
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

    public function test_index_search_finds_patient_by_apelido(): void
    {
        $patient = Patient::factory()->forClinic(
            \Modules\Clinic\Models\Clinic::find($this->clinicUser->clinic_id)
        )->create([
            'clinic_user_id' => $this->clinicUser->id,
            'name'           => 'Paciente Nome Legal',
            'apelido'        => 'QA Apelido Busca',
            'use_apelido'    => true,
        ]);

        $this->actingAs($this->clinicUser, 'clinic')
            ->getJson('/api/clinic/patients?search=QA Apelido Busca')
            ->assertOk()
            ->assertJsonPath('data.data.0.id', $patient->id)
            ->assertJsonPath('data.total', 1);
    }

    public function test_index_search_finds_patient_by_masked_cpf(): void
    {
        $patient = Patient::factory()->forClinic(
            \Modules\Clinic\Models\Clinic::find($this->clinicUser->clinic_id)
        )->create([
            'clinic_user_id' => $this->clinicUser->id,
            'name'           => 'Paciente CPF Mascara',
            'cpf'            => '42554958076',
        ]);

        $this->actingAs($this->clinicUser, 'clinic')
            ->getJson('/api/clinic/patients?search=' . urlencode('425.549.580-76'))
            ->assertOk()
            ->assertJsonPath('data.data.0.id', $patient->id)
            ->assertJsonPath('data.total', 1);
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

    public function test_upload_photo_stores_the_path_and_returns_a_signed_url(): void
    {
        $patient = $this->createPatientForClinic();

        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('uploadFile')
                ->once()
                ->andReturn([
                    'filename'          => 'photo.jpg',
                    'original_filename' => 'my-photo.jpg',
                    'path'              => 'patients/photos/photo.jpg',
                    'mime_type'         => 'image/jpeg',
                    'size'              => 1024,
                ]);
        });

        $uploaded = $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$patient->id}/photo", [
                'photo' => UploadedFile::fake()->create('my-photo.jpg', 100, 'image/jpeg'),
            ])->assertOk();
        $this->assertSignedImageUrl($uploaded->json('data.photo_url'), 'patients/photos/photo.jpg');
        $this->assertArrayNotHasKey('photo_path', $uploaded->json('data'));

        $this->assertDatabaseHas('patients', [
            'id'         => $patient->id,
            'photo_path' => 'patients/photos/photo.jpg',
        ]);
    }

    public function test_upload_photo_accepts_jpeg_png_and_webp(): void
    {
        $patient = $this->createPatientForClinic();

        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('uploadFile')->andReturn([
                'filename'          => 'photo.png',
                'original_filename' => 'photo.png',
                'path'              => 'patients/photos/photo.png',
                'mime_type'         => 'image/png',
                'size'              => 512,
            ]);
            $mock->shouldReceive('deletePrivateFile')->andReturnTrue();
        });

        $mimes = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];

        foreach ($mimes as $ext => $mime) {
            $this->actingAs($this->clinicUser, 'clinic')
                ->postJson("/api/clinic/patients/{$patient->id}/photo", [
                    'photo' => UploadedFile::fake()->create("photo.{$ext}", 100, $mime),
                ])->assertOk();
        }
    }

    public function test_update_stores_masked_cpf_as_digits(): void
    {
        $patient = $this->createPatientForClinic();

        $this->actingAs($this->clinicUser, 'clinic')
            ->putJson("/api/clinic/patients/{$patient->id}", [
                'is_foreign' => false,
                'cpf'        => '111.444.777-35',
            ])
            ->assertOk();

        $this->assertSame('11144477735', $patient->fresh()->cpf);
    }

    public function test_update_rejects_masked_cpf_already_used_in_same_clinic(): void
    {
        $this->createPatientForClinic()->update(['cpf' => '11144477735']);
        $patient = $this->createPatientForClinic();

        $this->actingAs($this->clinicUser, 'clinic')
            ->putJson("/api/clinic/patients/{$patient->id}", [
                'is_foreign' => false,
                'cpf'        => '111.444.777-35',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cpf');
    }

    public function test_update_keeps_foreign_document_as_typed(): void
    {
        $patient = $this->createPatientForClinic();

        $this->actingAs($this->clinicUser, 'clinic')
            ->putJson("/api/clinic/patients/{$patient->id}", [
                'is_foreign' => true,
                'cpf'        => 'AB-123.456',
            ])
            ->assertOk();

        $this->assertSame('AB-123.456', $patient->fresh()->cpf);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    public function test_removing_a_photo_shared_with_another_patient_keeps_the_file(): void
    {
        $patient = $this->createPatientForClinic();
        $other   = $this->createPatientForClinic();
        Patient::whereKey([$patient->id, $other->id])->update(['photo_path' => 'patients/photos/compartilhada.png']);

        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldNotReceive('deletePrivateFile');
        });

        $this->actingAs($this->clinicUser, 'clinic')
            ->deleteJson("/api/clinic/patients/{$patient->id}/photo")
            ->assertOk();

        $this->assertDatabaseHas('patients', ['id' => $patient->id, 'photo_path' => null]);
        $this->assertDatabaseHas('patients', ['id' => $other->id, 'photo_path' => 'patients/photos/compartilhada.png']);
    }

    public function test_replacing_a_photo_only_used_by_this_patient_deletes_the_old_file(): void
    {
        $patient = $this->createPatientForClinic();
        $patient->forceFill(['photo_path' => 'patients/photos/antiga.png'])->save();

        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('uploadFile')->once()->andReturn([
                'filename'          => 'nova.png',
                'original_filename' => 'nova.png',
                'path'              => 'patients/photos/nova.png',
                'mime_type'         => 'image/png',
                'size'              => 512,
            ]);
            $mock->shouldReceive('deletePrivateFile')->once()->with('patients/photos/antiga.png');
        });

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$patient->id}/photo", [
                'photo' => UploadedFile::fake()->create('nova.png', 100, 'image/png'),
            ])->assertOk();
    }

    public function test_a_failure_deleting_the_old_photo_still_saves_the_new_one(): void
    {
        $patient = $this->createPatientForClinic();
        $patient->forceFill(['photo_path' => 'patients/photos/antiga.png'])->save();

        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('uploadFile')->once()->andReturn([
                'filename'          => 'nova.png',
                'original_filename' => 'nova.png',
                'path'              => 'patients/photos/nova.png',
                'mime_type'         => 'image/png',
                'size'              => 512,
            ]);
            $mock->shouldReceive('deletePrivateFile')->once()->andThrow(new \RuntimeException('R2 fora do ar'));
        });

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/patients/{$patient->id}/photo", [
                'photo' => UploadedFile::fake()->create('nova.png', 100, 'image/png'),
            ])->assertOk();
        $this->assertDatabaseHas('patients', ['id' => $patient->id, 'photo_path' => 'patients/photos/nova.png']);

        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('deletePrivateFile')->once()->andThrow(new \RuntimeException('R2 fora do ar'));
        });
        $this->actingAs($this->clinicUser, 'clinic')
            ->deleteJson("/api/clinic/patients/{$patient->id}/photo")
            ->assertOk();
        $this->assertDatabaseHas('patients', ['id' => $patient->id, 'photo_path' => null]);
    }

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
