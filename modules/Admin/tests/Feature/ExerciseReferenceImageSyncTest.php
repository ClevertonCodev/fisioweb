<?php

namespace Modules\Admin\Tests\Feature;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\ExerciseMedia;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Media\Events\VideoReferenceImagesChanged;
use Modules\Media\Models\Video;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ExerciseReferenceImageSyncTest extends TestCase
{
    use RefreshDatabase;

    private const NEW_PATHS = [
        'thumbnails/videos/nova-1.jpeg',
        'thumbnails/videos/nova-2.png',
    ];

    private PhysioArea $area;

    private Clinic $clinic;

    private ClinicUser $clinicAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->area        = PhysioArea::create(['name' => 'Ortopedia']);
        $this->clinic      = Clinic::factory()->create();
        $this->clinicAdmin = ClinicUser::factory()->create([
            'clinic_id' => $this->clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);
    }

    public function test_clinic_changing_reference_images_does_not_touch_approved_exercise_pdf_images(): void
    {
        $video    = $this->clinicVideo($this->clinic);
        $exercise = $this->exerciseWithImage($this->clinic->id, Exercise::REVIEW_APPROVED, $video);

        $this->actingAs($this->clinicAdmin, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => self::NEW_PATHS,
            ])
            ->assertOk();

        $this->assertSame(['aprovada.jpg'], $this->imagePaths($exercise));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function notApprovedStatuses(): array
    {
        return [
            'pendente'  => [Exercise::REVIEW_PENDING],
            'rejeitado' => [Exercise::REVIEW_REJECTED],
        ];
    }

    #[DataProvider('notApprovedStatuses')]
    public function test_owner_clinic_not_approved_exercise_receives_new_images_from_clinic_event_while_approved_one_keeps_old(string $reviewStatus): void
    {
        $video    = $this->clinicVideo($this->clinic);
        $approved = $this->exerciseWithImage($this->clinic->id, Exercise::REVIEW_APPROVED, $video);
        $editable = $this->exerciseWithImage($this->clinic->id, $reviewStatus, $video);

        $this->dispatchClinicChange($video, $this->clinic->id);

        $this->assertSame(self::NEW_PATHS, $this->imagePaths($editable));
        $this->assertSame(['aprovada.jpg'], $this->imagePaths($approved));
    }

    #[DataProvider('notApprovedStatuses')]
    public function test_owner_clinic_change_on_video_with_approved_exercise_is_a_proposal_and_touches_no_pdf_image(string $reviewStatus): void
    {
        $video    = $this->clinicVideo($this->clinic);
        $approved = $this->exerciseWithImage($this->clinic->id, Exercise::REVIEW_APPROVED, $video);
        $editable = $this->exerciseWithImage($this->clinic->id, $reviewStatus, $video);

        $this->actingAs($this->clinicAdmin, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => self::NEW_PATHS,
            ])
            ->assertOk()
            ->assertJsonPath('data.proposal_pending', true);

        $this->assertSame(['aprovada.jpg'], $this->imagePaths($editable));
        $this->assertSame(['aprovada.jpg'], $this->imagePaths($approved));
    }

    public function test_clinic_event_does_not_touch_global_or_other_clinic_exercise(): void
    {
        $otherClinic = Clinic::factory()->create();
        $video       = $this->clinicVideo($this->clinic);
        $global      = $this->exerciseWithImage(null, Exercise::REVIEW_APPROVED, $video);
        $ofOther     = $this->exerciseWithImage($otherClinic->id, Exercise::REVIEW_PENDING, $video);

        $this->dispatchClinicChange($video, $this->clinic->id);

        $this->assertSame(['aprovada.jpg'], $this->imagePaths($global));
        $this->assertSame(['aprovada.jpg'], $this->imagePaths($ofOther));
    }

    public function test_other_clinic_gets_404_and_does_not_change_pdf_images_of_owner_exercise(): void
    {
        $otherClinic = Clinic::factory()->create();
        $otherAdmin  = ClinicUser::factory()->create([
            'clinic_id' => $otherClinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);
        $video    = $this->clinicVideo($this->clinic);
        $exercise = $this->exerciseWithImage($this->clinic->id, Exercise::REVIEW_PENDING, $video);

        $this->actingAs($otherAdmin, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => self::NEW_PATHS,
            ])
            ->assertNotFound();

        $this->assertSame(['aprovada.jpg'], $this->imagePaths($exercise));
        $this->assertArrayNotHasKey('reference_images', $video->fresh()->metadata ?? []);
    }

    public function test_operator_changing_reference_images_updates_every_linked_exercise(): void
    {
        $operator = AdminUser::factory()->create();
        $video    = $this->clinicVideo($this->clinic);
        $approved = $this->exerciseWithImage($this->clinic->id, Exercise::REVIEW_APPROVED, $video);
        $global   = $this->exerciseWithImage(null, Exercise::REVIEW_APPROVED, $video);

        $this->actingAs($operator, 'admin')
            ->putJson("/api/admin/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => self::NEW_PATHS,
            ])
            ->assertOk();

        $this->assertSame(self::NEW_PATHS, $this->imagePaths($approved));
        $this->assertSame(self::NEW_PATHS, $this->imagePaths($global));
    }

    public function test_event_from_clinic_without_owner_clinic_does_not_touch_global_exercise(): void
    {
        $video  = Video::factory()->create(['status' => Video::STATUS_COMPLETED]);
        $global = $this->exerciseWithImage(null, Exercise::REVIEW_PENDING, $video);

        event(new VideoReferenceImagesChanged(
            version: 1,
            videoId: $video->id,
            ownerClinicId: null,
            changedByOperator: false,
            images: [[
                'file_path'         => self::NEW_PATHS[0],
                'cdn_url'           => 'https://cdn.example.com/' . self::NEW_PATHS[0],
                'original_filename' => 'nova-1.jpeg',
                'mime_type'         => 'image/jpeg',
                'size'              => 0,
            ]],
            occurredAt: CarbonImmutable::now(),
        ));

        $this->assertSame(['aprovada.jpg'], $this->imagePaths($global));
    }

    private function dispatchClinicChange(Video $video, int $ownerClinicId): void
    {
        event(new VideoReferenceImagesChanged(
            version: 1,
            videoId: $video->id,
            ownerClinicId: $ownerClinicId,
            changedByOperator: false,
            images: array_map(fn (string $path) => [
                'file_path'         => $path,
                'cdn_url'           => 'https://cdn.example.com/' . $path,
                'original_filename' => basename($path),
                'mime_type'         => 'image/jpeg',
                'size'              => 0,
            ], self::NEW_PATHS),
            occurredAt: CarbonImmutable::now(),
        ));
    }

    private function clinicVideo(Clinic $clinic): Video
    {
        return Video::factory()->create([
            'clinic_id' => $clinic->id,
            'status'    => Video::STATUS_COMPLETED,
            'metadata'  => ['issued_image_paths' => self::NEW_PATHS],
        ]);
    }

    private function exerciseWithImage(?int $clinicId, string $reviewStatus, Video $video): Exercise
    {
        $exercise = Exercise::create([
            'name'           => 'Exercício ' . $reviewStatus,
            'physio_area_id' => $this->area->id,
            'clinic_id'      => $clinicId,
            'review_status'  => $reviewStatus,
            'is_active'      => true,
        ]);
        $exercise->videos()->attach($video->id);

        ExerciseMedia::create([
            'exercise_id'       => $exercise->id,
            'type'              => ExerciseMedia::TYPE_IMAGE,
            'file_path'         => 'aprovada.jpg',
            'cdn_url'           => 'https://cdn.example.com/aprovada.jpg',
            'original_filename' => 'aprovada.jpg',
            'mime_type'         => 'image/jpeg',
            'size'              => 1,
            'sort_order'        => 0,
        ]);

        return $exercise;
    }

    /**
     * @return list<string>
     */
    private function imagePaths(Exercise $exercise): array
    {
        return ExerciseMedia::query()
            ->where('exercise_id', $exercise->id)
            ->where('type', ExerciseMedia::TYPE_IMAGE)
            ->orderBy('sort_order')
            ->pluck('file_path')
            ->all();
    }
}
