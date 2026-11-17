<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Mockery\MockInterface;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PatientClinicIsolationTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $adminA;

    private Patient $patientA;

    private Patient $patientB;

    protected function setUp(): void
    {
        parent::setUp();

        $clinicA      = Clinic::factory()->create();
        $clinicB      = Clinic::factory()->create();
        $this->adminA = ClinicUser::factory()->create(['clinic_id' => $clinicA->id]);
        $adminB       = ClinicUser::factory()->create(['clinic_id' => $clinicB->id]);

        $this->patientA = Patient::factory()->create([
            'clinic_id'      => $clinicA->id,
            'clinic_user_id' => $this->adminA->id,
            'name'           => 'Paciente A',
            'photo_path'     => 'patients/photos/a.jpg',
            'is_active'      => true,
        ]);
        $this->patientB = Patient::factory()->create([
            'clinic_id'      => $clinicB->id,
            'clinic_user_id' => $adminB->id,
            'name'           => 'Paciente B',
            'photo_path'     => 'patients/photos/b.jpg',
            'is_active'      => true,
        ]);
    }

    public function test_show_returns_own_patient_and_hides_another_clinic_patient(): void
    {
        $this->actingAs($this->adminA, 'clinic')
            ->getJson("/api/clinic/patients/{$this->patientA->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $this->patientA->id);

        $this->actingAs($this->adminA, 'clinic')
            ->getJson("/api/clinic/patients/{$this->patientB->id}")
            ->assertNotFound();
    }

    public function test_update_changes_own_patient_and_not_another_clinic_patient(): void
    {
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/patients/{$this->patientA->id}", ['name' => 'Paciente A Editado'])
            ->assertOk();

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/patients/{$this->patientB->id}", ['name' => 'Alterado por A'])
            ->assertNotFound();

        $this->assertDatabaseHas('patients', ['id' => $this->patientA->id, 'name' => 'Paciente A Editado']);
        $this->assertDatabaseHas('patients', ['id' => $this->patientB->id, 'name' => 'Paciente B']);
    }

    public function test_upload_photo_reaches_own_patient_and_not_another_clinic_photo(): void
    {
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('uploadFile')
                ->once()
                ->andReturn([
                    'filename'          => 'a-new.jpg',
                    'original_filename' => 'a-new.jpg',
                    'path'              => 'patients/photos/a-new.jpg',
                    'mime_type'         => 'image/jpeg',
                    'size'              => 1024,
                ]);
            $mock->shouldReceive('deletePrivateFile')->once()->with('patients/photos/a.jpg')->andReturnTrue();
        });

        $uploaded = $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/photo", [
                'photo' => UploadedFile::fake()->create('a-new.jpg', 100, 'image/jpeg'),
            ])
            ->assertOk();
        $this->assertSignedImageUrl($uploaded->json('data.photo_url'), 'patients/photos/a-new.jpg');

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientB->id}/photo", [
                'photo' => UploadedFile::fake()->create('hack.jpg', 100, 'image/jpeg'),
            ])
            ->assertNotFound();

        $this->assertDatabaseHas('patients', ['id' => $this->patientA->id, 'photo_path' => 'patients/photos/a-new.jpg']);
        $this->assertDatabaseHas('patients', ['id' => $this->patientB->id, 'photo_path' => 'patients/photos/b.jpg']);
    }

    public function test_delete_photo_clears_own_patient_photo_and_not_another_clinic_photo(): void
    {
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('deletePrivateFile')->once()->with('patients/photos/a.jpg')->andReturnTrue();
        });

        $this->actingAs($this->adminA, 'clinic')
            ->deleteJson("/api/clinic/patients/{$this->patientA->id}/photo")
            ->assertOk();

        $this->actingAs($this->adminA, 'clinic')
            ->deleteJson("/api/clinic/patients/{$this->patientB->id}/photo")
            ->assertNotFound();

        $this->assertDatabaseHas('patients', ['id' => $this->patientA->id, 'photo_path' => null]);
        $this->assertDatabaseHas('patients', ['id' => $this->patientB->id, 'photo_path' => 'patients/photos/b.jpg']);
    }

    public function test_reactivate_reaches_own_patient_and_not_another_clinic_patient(): void
    {
        $this->patientA->update(['is_active' => false]);
        $this->patientB->update(['is_active' => false]);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientB->id}/reactivate")
            ->assertNotFound()
            ->assertJsonMissingPath('data');

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/reactivate")
            ->assertOk();

        $this->assertDatabaseHas('patients', ['id' => $this->patientA->id, 'is_active' => true]);
        $this->assertDatabaseHas('patients', ['id' => $this->patientB->id, 'is_active' => false]);
    }

    public function test_bulk_inactivate_only_reaches_own_clinic_patients(): void
    {
        $this->actingAs($this->adminA, 'clinic')
            ->postJson('/api/clinic/patients/bulk-inactivate', ['ids' => [$this->patientA->id, $this->patientB->id]])
            ->assertOk()
            ->assertJsonPath('count', 1);

        $this->assertDatabaseHas('patients', ['id' => $this->patientA->id, 'is_active' => false]);
        $this->assertDatabaseHas('patients', ['id' => $this->patientB->id, 'is_active' => true]);
    }
}
