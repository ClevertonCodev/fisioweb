<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Tests\TestCase;

class ClinicUserIsolationTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $adminA;

    private ClinicUser $physioA;

    private ClinicUser $adminB;

    protected function setUp(): void
    {
        parent::setUp();

        $clinicA = Clinic::factory()->create();
        $clinicB = Clinic::factory()->create();

        $this->adminA  = ClinicUser::factory()->create(['clinic_id' => $clinicA->id]);
        $this->physioA = ClinicUser::factory()->create([
            'clinic_id' => $clinicA->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
            'name'      => 'Fisio da Clínica A',
        ]);
        $this->adminB = ClinicUser::factory()->create(['clinic_id' => $clinicB->id]);
    }

    public function test_index_does_not_list_users_of_another_clinic(): void
    {
        $response = $this->actingAs($this->adminB, 'clinic')
            ->getJson('/api/clinic/users')
            ->assertOk();

        $this->assertNotContains($this->physioA->id, $this->collectIds($response->json('data')));
        $this->assertNotContains($this->adminA->id, $this->collectIds($response->json('data')));
    }

    public function test_index_lists_users_of_own_clinic(): void
    {
        $this->physioA->forceFill([
            'photo_path' => 'clinic-users/photos/a.jpg',
        ])->save();

        $data = $this->actingAs($this->adminA, 'clinic')
            ->getJson('/api/clinic/users')
            ->assertOk()
            ->json('data');
        $items = is_array($data) && array_key_exists('data', $data) ? $data['data'] : $data;
        $ids   = $this->collectIds($data);

        $this->assertContains($this->adminA->id, $ids);
        $this->assertContains($this->physioA->id, $ids);
        $this->assertArrayNotHasKey(
            'photo_path',
            collect($items)->firstWhere('id', $this->physioA->id),
        );
    }

    public function test_store_creates_user_in_own_clinic(): void
    {
        $this->actingAs($this->adminA, 'clinic')
            ->postJson('/api/clinic/users', [
                'name'     => 'Nova Secretária',
                'email'    => 'nova.secretaria@example.com',
                'password' => 'senha-segura-123',
                'role'     => ClinicUser::ROLE_SECRETARY,
                'document' => '11144477735',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('clinic_users', [
            'email'     => 'nova.secretaria@example.com',
            'clinic_id' => $this->adminA->clinic_id,
        ]);
    }

    public function test_store_is_forbidden_for_physiotherapist_and_secretary(): void
    {
        $secretaryA = ClinicUser::factory()->create([
            'clinic_id' => $this->adminA->clinic_id,
            'role'      => ClinicUser::ROLE_SECRETARY,
        ]);

        foreach ([$this->physioA, $secretaryA] as $index => $user) {
            $this->actingAs($user, 'clinic')
                ->postJson('/api/clinic/users', [
                    'name'     => 'Colega',
                    'email'    => "colega{$index}@example.com",
                    'password' => 'senha-segura-123',
                    'role'     => ClinicUser::ROLE_ADMIN,
                    'document' => '11144477735',
                ])
                ->assertForbidden();
        }

        $this->assertDatabaseMissing('clinic_users', ['email' => 'colega0@example.com']);
        $this->assertDatabaseMissing('clinic_users', ['email' => 'colega1@example.com']);
    }

    public function test_photo_of_own_clinic_user_can_be_uploaded_and_removed(): void
    {
        $this->mock(FileServiceInterface::class, function ($mock) {
            $mock->shouldReceive('uploadFile')->once()->andReturn([
                'path'              => 'clinic-users/photos/nova.jpg',
                'filename'          => 'nova.jpg',
                'original_filename' => 'foto.jpg',
                'mime_type'         => 'image/jpeg',
                'size'              => 100,
            ]);
            $mock->shouldReceive('deletePrivateFile')->once()->with('clinic-users/photos/nova.jpg')->andReturnTrue();
        });

        $uploaded = $this->actingAs($this->adminA, 'clinic')
            ->post("/api/clinic/users/{$this->physioA->id}/photo", ['photo' => UploadedFile::fake()->image('foto.jpg')], ['Accept' => 'application/json'])
            ->assertOk();
        $this->assertSignedImageUrl($uploaded->json('data.photo_url'), 'clinic-users/photos/nova.jpg');
        $this->assertDatabaseHas('clinic_users', ['id' => $this->physioA->id, 'photo_path' => 'clinic-users/photos/nova.jpg']);

        $this->actingAs($this->adminA, 'clinic')
            ->deleteJson("/api/clinic/users/{$this->physioA->id}/photo")
            ->assertOk();
        $this->assertDatabaseHas('clinic_users', ['id' => $this->physioA->id, 'photo_path' => null]);
    }

    public function test_photo_of_another_clinic_user_cannot_be_uploaded_or_removed(): void
    {
        $this->physioA->forceFill(['photo_path' => 'clinic-users/photos/a.jpg'])->save();
        $this->mock(FileServiceInterface::class, function ($mock) {
            $mock->shouldReceive('uploadFile')->never();
        });

        $this->actingAs($this->adminB, 'clinic')
            ->post("/api/clinic/users/{$this->physioA->id}/photo", ['photo' => UploadedFile::fake()->image('foto.jpg')], ['Accept' => 'application/json'])
            ->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')
            ->deleteJson("/api/clinic/users/{$this->physioA->id}/photo")
            ->assertNotFound();

        $this->assertDatabaseHas('clinic_users', ['id' => $this->physioA->id, 'photo_path' => 'clinic-users/photos/a.jpg']);
    }

    public function test_professionals_does_not_list_users_of_another_clinic(): void
    {
        $response = $this->actingAs($this->adminB, 'clinic')
            ->getJson('/api/clinic/users/professionals')
            ->assertOk();

        $this->assertNotContains($this->physioA->id, $this->collectIds($response->json('data')));
    }

    public function test_show_user_of_another_clinic_is_denied(): void
    {
        $this->actingAs($this->adminB, 'clinic')
            ->getJson("/api/clinic/users/{$this->physioA->id}")
            ->assertJsonMissing(['name' => 'Fisio da Clínica A'])
            ->assertStatus(404);
    }

    public function test_update_user_of_another_clinic_is_denied(): void
    {
        $this->actingAs($this->adminB, 'clinic')
            ->putJson("/api/clinic/users/{$this->physioA->id}", [
                'name'     => 'Alterado por B',
                'email'    => $this->physioA->email,
                'role'     => ClinicUser::ROLE_PHYSIOTHERAPIST,
                'document' => '11144477735',
            ])
            ->assertNotFound();

        $this->assertDatabaseHas('clinic_users', ['id' => $this->physioA->id, 'name' => 'Fisio da Clínica A']);
    }

    public function test_destroy_user_of_another_clinic_is_denied(): void
    {
        $this->actingAs($this->adminB, 'clinic')
            ->deleteJson("/api/clinic/users/{$this->physioA->id}")
            ->assertNotFound();

        $this->assertNotSoftDeleted('clinic_users', ['id' => $this->physioA->id]);
    }

    public function test_partial_update_of_another_clinic_user_is_not_found(): void
    {
        foreach ([['role' => ClinicUser::ROLE_SECRETARY], ['status' => false], ['email' => 'nao-e-email']] as $payload) {
            $this->actingAs($this->adminB, 'clinic')
                ->putJson("/api/clinic/users/{$this->physioA->id}", $payload)
                ->assertNotFound()
                ->assertJsonMissing(['name' => 'Fisio da Clínica A']);
        }

        $this->assertDatabaseHas('clinic_users', [
            'id'     => $this->physioA->id,
            'role'   => ClinicUser::ROLE_PHYSIOTHERAPIST,
            'status' => ClinicUser::STATUS_ACTIVE,
        ]);
    }

    public function test_not_found_does_not_reveal_whether_the_id_exists_elsewhere(): void
    {
        $missingId = ClinicUser::withTrashed()->max('id') + 100;

        $otherClinic = $this->actingAs($this->adminB, 'clinic')
            ->getJson("/api/clinic/users/{$this->physioA->id}")
            ->assertNotFound()
            ->json();
        $missing = $this->actingAs($this->adminB, 'clinic')
            ->getJson("/api/clinic/users/{$missingId}")
            ->assertNotFound()
            ->json();

        $this->assertSame($otherClinic, $missing);
    }

    private function collectIds(mixed $data): array
    {
        $items = is_array($data) && array_key_exists('data', $data) ? $data['data'] : $data;

        return array_map(fn (array $item) => (int) $item['id'], (array) $items);
    }
}
