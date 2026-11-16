<?php

namespace Modules\Media\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Media\Models\Video;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class VideoMetadataVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private const APPROVED_IMAGE = 'thumbnails/videos/aprovada.jpg';

    private const ISSUED_PATH = 'thumbnails/videos/emitida-nao-revisada.jpg';

    private Clinic $clinicA;

    private Video $video;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinicA = Clinic::factory()->create();
        $this->video   = Video::factory()->create([
            'clinic_id' => $this->clinicA->id,
            'status'    => Video::STATUS_COMPLETED,
            'metadata'  => [
                'original_name'      => 'original.mp4',
                'upload_method'      => 'presigned',
                'issued_image_paths' => [self::ISSUED_PATH],
                'reference_images'   => [[
                    'file_path'         => self::APPROVED_IMAGE,
                    'cdn_url'           => 'https://cdn.example.com/' . self::APPROVED_IMAGE,
                    'original_filename' => 'aprovada.jpg',
                    'mime_type'         => 'image/jpeg',
                    'size'              => 1,
                ]],
            ],
        ]);

        $exercise = Exercise::create([
            'name'           => 'METADATA aprovado da A',
            'physio_area_id' => PhysioArea::create(['name' => 'Ortopedia'])->id,
            'clinic_id'      => $this->clinicA->id,
            'review_status'  => Exercise::REVIEW_APPROVED,
            'is_active'      => true,
        ]);
        $exercise->videos()->attach($this->video->id);
    }

    public function test_operator_sees_the_whole_metadata_in_video_detail(): void
    {
        $this->actingAs(AdminUser::factory()->create(), 'admin')
            ->getJson("/api/admin/media/videos/{$this->video->id}")
            ->assertOk()
            ->assertJsonPath('data.metadata.original_name', 'original.mp4')
            ->assertJsonPath('data.metadata.issued_image_paths.0', self::ISSUED_PATH);
    }

    public function test_operator_sees_the_whole_metadata_in_video_list(): void
    {
        $this->actingAs(AdminUser::factory()->create(), 'admin')
            ->getJson('/api/admin/media/videos')
            ->assertOk()
            ->assertJsonPath('data.data.0.metadata.original_name', 'original.mp4')
            ->assertJsonPath('data.data.0.metadata.issued_image_paths.0', self::ISSUED_PATH);
    }

    public function test_operator_gets_back_the_metadata_just_saved(): void
    {
        $this->actingAs(AdminUser::factory()->create(), 'admin')
            ->patchJson("/api/admin/media/videos/{$this->video->id}/metadata", ['metadata' => ['nota' => 'revisado']])
            ->assertOk()
            ->assertJsonPath('data.metadata.nota', 'revisado')
            ->assertJsonPath('data.metadata.original_name', 'original.mp4');
    }

    /**
     * @return array<string, array{string}>
     */
    public static function clinics(): array
    {
        return [
            'clínica dona'  => ['owner'],
            'outra clínica' => ['other'],
        ];
    }

    #[DataProvider('clinics')]
    public function test_clinic_receives_approved_reference_images_and_nothing_else_from_the_metadata(string $who): void
    {
        $clinic = $who === 'owner' ? $this->clinicA : Clinic::factory()->create();
        $user   = ClinicUser::factory()->create(['clinic_id' => $clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);

        $response = $this->actingAs($user, 'clinic')
            ->getJson('/api/clinic/exercises?search=METADATA')
            ->assertOk()
            ->assertJsonPath('data.data.0.videos.0.metadata.reference_images.0.file_path', self::APPROVED_IMAGE);

        $this->assertSame(['reference_images'], array_keys($response->json('data.data.0.videos.0.metadata')));
        $this->assertStringNotContainsString(self::ISSUED_PATH, json_encode($response->json(), JSON_UNESCAPED_SLASHES));
    }
}
