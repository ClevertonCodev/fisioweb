<?php

namespace Modules\ClinicalRecord\Tests\Feature;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\Filesystem;
use League\Flysystem\Local\LocalFilesystemAdapter;
use League\Flysystem\UnableToDeleteFile;
use Mockery\MockInterface;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicalRecord\Models\PatientFile;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PatientFileSignedLinkTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $secretary;

    private ClinicUser $admin;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        config(['cloudflare.r2_disk' => 'r2', 'cloudflare.cdn_url' => 'https://cdn.example.test']);
        Storage::fake('r2');

        $this->clinic    = Clinic::factory()->create();
        $this->secretary = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $this->admin     = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id]);
        $this->patient   = Patient::factory()->forClinic($this->clinic)->create();
    }

    public function test_upload_and_listing_never_return_a_public_address(): void
    {
        $created = $this->actingAs($this->secretary, 'clinic')
            ->postJson($this->filesUrl(), [
                'file' => UploadedFile::fake()->create('laudo.pdf', 10, 'application/pdf'),
            ])
            ->assertCreated()
            ->assertJsonPath('data.original_name', 'laudo.pdf');

        $this->assertArrayNotHasKey('cdn_url', $created->json('data'));
        $this->assertArrayNotHasKey('file_path', $created->json('data'));
        $this->assertStringNotContainsString('cdn.example.test', $created->getContent());

        $listed = $this->actingAs($this->admin, 'clinic')
            ->getJson($this->filesUrl())
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->assertArrayNotHasKey('cdn_url', $listed->json('data.0'));
        $this->assertArrayNotHasKey('file_path', $listed->json('data.0'));
        $this->assertStringNotContainsString('cdn.example.test', $listed->getContent());

        $row = PatientFile::query()->findOrFail($created->json('data.id'));
        $this->assertNull($row->cdn_url);
        Storage::disk('r2')->assertExists($row->file_path);
    }

    public function test_upload_goes_through_the_private_path_with_the_name_and_type_from_the_content(): void
    {
        $tmp  = tempnam(sys_get_temp_dir(), 'laudo');
        file_put_contents($tmp, "%PDF-1.4\n<html><script>alert(1)</script></html>");
        $file = new UploadedFile($tmp, 'x.html', 'text/html', null, true);
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldNotReceive('uploadFile');
            $mock->shouldReceive('uploadFileAs')
                ->once()
                ->withArgs(fn (UploadedFile $f, string $directory, string $name, string $type) => $directory === 'patients/files'
                    && preg_match('/^[0-9a-f-]{36}\.pdf$/', $name) === 1
                    && $type === 'application/pdf')
                ->andReturnUsing(fn (UploadedFile $f, string $directory, string $name, string $type) => [
                    'filename'          => $name,
                    'original_filename' => $f->getClientOriginalName(),
                    'path'              => "{$directory}/{$name}",
                    'mime_type'         => $type,
                    'size'              => (int) $f->getSize(),
                ]);
        });

        try {
            $this->actingAs($this->secretary, 'clinic')
                ->post($this->filesUrl(), ['file' => $file], ['Accept' => 'application/json'])
                ->assertCreated()
                ->assertJsonPath('data.mime_type', 'application/pdf');
        } finally {
            @unlink($tmp);
        }

        $this->assertStringEndsWith('.pdf', (string) PatientFile::query()->value('file_path'));
    }

    public function test_a_type_outside_the_stored_list_is_refused_before_uploading(): void
    {
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldNotReceive('uploadFile');
            $mock->shouldNotReceive('uploadFileAs');
        });

        $this->actingAs($this->secretary, 'clinic')
            ->postJson($this->filesUrl(), ['file' => UploadedFile::fake()->create('foto.jpg', 10, 'image/pjpeg')])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['file' => 'Tipos permitidos']);

        $this->assertDatabaseCount('clinic_patient_files', 0);
    }

    public function test_deleting_the_file_also_removes_the_stored_object(): void
    {
        $id   = $this->actingAs($this->secretary, 'clinic')
            ->postJson($this->filesUrl(), [
                'file' => UploadedFile::fake()->create('laudo.pdf', 10, 'application/pdf'),
            ])
            ->assertCreated()
            ->json('data.id');
        $path = PatientFile::query()->findOrFail($id)->file_path;

        $this->actingAs($this->admin, 'clinic')
            ->deleteJson("{$this->filesUrl()}/{$id}")
            ->assertOk();

        $this->assertSoftDeleted('clinic_patient_files', ['id' => $id]);
        Storage::disk('r2')->assertMissing($path);
    }

    public function test_a_failure_removing_the_stored_object_is_reported_and_keeps_the_deletion(): void
    {
        Exceptions::fake();
        $file = PatientFile::factory()->forPatient($this->patient, $this->clinic)->create(['clinic_user_id' => $this->admin->id]);
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) use ($file) {
            $mock->shouldReceive('deletePrivateFile')->once()->with($file->file_path)->andThrow(new \RuntimeException('R2 fora do ar'));
        });

        $this->actingAs($this->admin, 'clinic')
            ->deleteJson("{$this->filesUrl()}/{$file->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Arquivo removido com sucesso.');

        $this->assertSoftDeleted('clinic_patient_files', ['id' => $file->id]);
        Exceptions::assertReported(fn (\RuntimeException $e) => $e->getMessage() === 'R2 fora do ar');
    }

    public function test_the_bucket_refusing_the_delete_is_reported_and_keeps_the_deletion(): void
    {
        Exceptions::fake();
        $root    = storage_path('framework/testing/disks/r2-refusing-deletes');
        $adapter = new class($root) extends LocalFilesystemAdapter
        {
            public function delete(string $path): void
            {
                throw UnableToDeleteFile::atLocation($path, 'AccessDenied');
            }
        };
        Storage::set('r2', new FilesystemAdapter(new Filesystem($adapter), $adapter, ['root' => $root, 'throw' => false, 'report' => false]));
        $file = PatientFile::factory()->forPatient($this->patient, $this->clinic)->create(['file_path' => 'patients/files/abc.pdf']);
        Storage::disk('r2')->put('patients/files/abc.pdf', '%PDF-1.4');

        $this->actingAs($this->admin, 'clinic')
            ->deleteJson("{$this->filesUrl()}/{$file->id}")
            ->assertOk();

        $this->assertSoftDeleted('clinic_patient_files', ['id' => $file->id]);
        Exceptions::assertReported(fn (\RuntimeException $e) => str_contains($e->getMessage(), 'patients/files')
            && !str_contains($e->getMessage(), 'abc.pdf'));
    }

    public function test_any_role_of_the_owning_clinic_gets_a_five_minute_signed_link(): void
    {
        $this->travelTo(now()->setTime(12, 0));
        $file   = PatientFile::factory()->forPatient($this->patient, $this->clinic)->create([
            'original_name' => 'laudo.pdf',
            'file_path'     => 'patients/files/abc.pdf',
            'mime_type'     => 'application/pdf',
        ]);
        $signed = 'https://conta.r2.cloudflarestorage.com/bucket/patients/files/abc.pdf?X-Amz-Expires=300&X-Amz-Signature=abc';
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) use ($signed) {
            $mock->shouldReceive('createPresignedDownloadUrl')
                ->once()
                ->with('patients/files/abc.pdf', 300, 'laudo.pdf', 'application/pdf')
                ->andReturn(['url' => $signed, 'expires_at' => now()->addMinutes(5)->toISOString()]);
        });

        $this->actingAs($this->secretary, 'clinic')
            ->getJson("{$this->filesUrl()}/{$file->id}/url")
            ->assertOk()
            ->assertExactJson(['data' => [
                'url'        => $signed,
                'expires_at' => now()->addMinutes(5)->toISOString(),
            ]]);
    }

    public function test_another_clinic_gets_404_for_the_link_of_its_patient_or_file(): void
    {
        $file         = PatientFile::factory()->forPatient($this->patient, $this->clinic)->create();
        $otherClinic  = Clinic::factory()->create();
        $otherAdmin   = ClinicUser::factory()->create(['clinic_id' => $otherClinic->id]);
        $otherPatient = Patient::factory()->forClinic($otherClinic)->create();
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldNotReceive('createPresignedDownloadUrl');
            $mock->shouldNotReceive('deletePrivateFile');
        });

        $as = $this->actingAs($otherAdmin, 'clinic');
        $as->getJson("{$this->filesUrl()}/{$file->id}/url")->assertNotFound();
        $as->getJson("/api/clinic/patients/{$otherPatient->id}/files/{$file->id}/url")->assertNotFound();
        $as->deleteJson("{$this->filesUrl()}/{$file->id}")->assertNotFound();
        $as->deleteJson("/api/clinic/patients/{$otherPatient->id}/files/{$file->id}")->assertNotFound();

        $this->assertNotSoftDeleted('clinic_patient_files', ['id' => $file->id]);
    }

    public function test_a_file_of_another_patient_or_already_deleted_is_not_reached(): void
    {
        $otherPatient = Patient::factory()->forClinic($this->clinic)->create();
        $foreign      = PatientFile::factory()->forPatient($otherPatient, $this->clinic)->create();
        $deleted      = PatientFile::factory()->forPatient($this->patient, $this->clinic)->create();
        $deleted->delete();
        $this->mock(FileServiceInterface::class, fn (MockInterface $mock) => $mock->shouldNotReceive('createPresignedDownloadUrl'));

        $as = $this->actingAs($this->admin, 'clinic');
        $as->getJson("{$this->filesUrl()}/{$foreign->id}/url")->assertNotFound();
        $as->getJson("{$this->filesUrl()}/{$deleted->id}/url")->assertNotFound();
    }

    public function test_any_role_lists_the_files_and_the_previews_sign_only_the_images_of_the_patient(): void
    {
        $png          = PatientFile::factory()->forPatient($this->patient, $this->clinic)->create(['original_name' => 'raio-x.png', 'file_path' => 'patients/files/a.png', 'mime_type' => 'image/png']);
        $jpeg         = PatientFile::factory()->forPatient($this->patient, $this->clinic)->create(['original_name' => 'foto.jpg', 'file_path' => 'patients/files/b.jpg', 'mime_type' => 'image/jpeg']);
        PatientFile::factory()->forPatient($this->patient, $this->clinic)->create(['file_path' => 'patients/files/c.pdf', 'mime_type' => 'application/pdf']);
        $deleted      = PatientFile::factory()->forPatient($this->patient, $this->clinic)->create(['file_path' => 'patients/files/d.png', 'mime_type' => 'image/png']);
        $deleted->delete();
        $otherPatient = Patient::factory()->forClinic($this->clinic)->create();
        PatientFile::factory()->forPatient($otherPatient, $this->clinic)->create(['file_path' => 'patients/files/e.png', 'mime_type' => 'image/png']);
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) {
            $mock->shouldReceive('createPresignedDownloadUrl')->twice()->andReturnUsing(
                fn (string $path) => ['url' => "https://assinado/{$path}", 'expires_at' => '2026-11-11T12:05:00.000000Z'],
            );
        });

        $physio = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        foreach ([$this->secretary, $physio] as $user) {
            $this->actingAs($user, 'clinic')->getJson($this->filesUrl())->assertOk()->assertJsonCount(3, 'data');
        }

        $rows = $this->actingAs($this->secretary, 'clinic')
            ->getJson("{$this->filesUrl()}/previews")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->json('data');

        $this->assertEqualsCanonicalizing([
            ['file_id' => $png->id, 'url' => 'https://assinado/patients/files/a.png', 'expires_at' => '2026-11-11T12:05:00.000000Z'],
            ['file_id' => $jpeg->id, 'url' => 'https://assinado/patients/files/b.jpg', 'expires_at' => '2026-11-11T12:05:00.000000Z'],
        ], $rows);
    }

    public function test_another_clinic_gets_404_for_the_previews_and_guests_get_401(): void
    {
        PatientFile::factory()->forPatient($this->patient, $this->clinic)->create(['mime_type' => 'image/png']);
        $otherAdmin = ClinicUser::factory()->create(['clinic_id' => Clinic::factory()->create()->id]);
        $this->mock(FileServiceInterface::class, fn (MockInterface $mock) => $mock->shouldNotReceive('createPresignedDownloadUrl'));

        $this->getJson("{$this->filesUrl()}/previews")->assertUnauthorized();
        $this->actingAs($otherAdmin, 'clinic')->getJson("{$this->filesUrl()}/previews")->assertNotFound();
    }

    public function test_the_listing_and_the_previews_go_through_the_file_policy(): void
    {
        PatientFile::factory()->forPatient($this->patient, $this->clinic)->create(['mime_type' => 'image/png']);
        Gate::policy(PatientFile::class, DenyingPatientFilePolicy::class);
        $this->mock(FileServiceInterface::class, fn (MockInterface $mock) => $mock->shouldNotReceive('createPresignedDownloadUrl'));

        $this->actingAs($this->secretary, 'clinic')
            ->getJson("{$this->filesUrl()}/previews")
            ->assertForbidden();
        $this->actingAs($this->secretary, 'clinic')
            ->getJson($this->filesUrl())
            ->assertForbidden();
    }

    public function test_unauthenticated_cannot_ask_for_the_link(): void
    {
        $file = PatientFile::factory()->forPatient($this->patient, $this->clinic)->create();

        $this->getJson("{$this->filesUrl()}/{$file->id}/url")->assertUnauthorized();
    }

    public function test_the_download_name_takes_the_extension_of_the_stored_type(): void
    {
        $files = [
            PatientFile::factory()->forPatient($this->patient, $this->clinic)->create(['original_name' => 'x.html', 'mime_type' => 'application/pdf']),
            PatientFile::factory()->forPatient($this->patient, $this->clinic)->create(['original_name' => 'raio-x', 'mime_type' => 'image/png']),
            PatientFile::factory()->forPatient($this->patient, $this->clinic)->create(['original_name' => 'Foto Março.JPEG', 'mime_type' => 'image/jpeg']),
        ];
        $names = [];
        $this->mock(FileServiceInterface::class, function (MockInterface $mock) use (&$names) {
            $mock->shouldReceive('createPresignedDownloadUrl')->times(3)->andReturnUsing(
                function (string $path, int $ttl, ?string $name, ?string $type) use (&$names) {
                    $names[] = [$name, $type];

                    return ['url' => 'https://assinado', 'expires_at' => now()->toISOString()];
                },
            );
        });

        foreach ($files as $file) {
            $this->actingAs($this->admin, 'clinic')->getJson("{$this->filesUrl()}/{$file->id}/url")->assertOk();
        }

        $this->assertSame([
            ['x.pdf', 'application/pdf'],
            ['raio-x.png', 'image/png'],
            ['Foto Março.jpg', 'image/jpeg'],
        ], $names);
    }

    private function filesUrl(): string
    {
        return "/api/clinic/patients/{$this->patient->id}/files";
    }
}

class DenyingPatientFilePolicy
{
    public function viewAny($user): bool
    {
        return false;
    }
}
