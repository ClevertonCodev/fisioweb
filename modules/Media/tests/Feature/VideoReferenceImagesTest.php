<?php

namespace Modules\Media\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\ExerciseMedia;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Media\Events\VideoReferenceImagesChanged;
use Modules\Media\Models\Video;
use Modules\Media\Repositories\VideoRepository;
use Tests\TestCase;

class VideoReferenceImagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_sync_two_reference_images_to_linked_exercises(): void
    {
        $admin = AdminUser::factory()->create();
        $area  = PhysioArea::create(['name' => 'Área Ref']);
        $video = Video::factory()->create(['status' => Video::STATUS_COMPLETED]);

        $exercise = Exercise::create([
            'name'           => 'Com vídeo',
            'physio_area_id' => $area->id,
            'created_by'     => $admin->id,
            'is_active'      => true,
        ]);
        $exercise->videos()->attach($video->id);

        $paths = [
            'covers/videos/ref-1.jpeg',
            'covers/videos/ref-2.png',
        ];

        $synced = $this->actingAs($admin, 'admin')
            ->putJson("/api/admin/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => $paths,
            ])
            ->assertOk();
        $this->assertSignedImageUrl($synced->json('data.metadata.reference_images.0.url'), $paths[0]);
        $this->assertArrayNotHasKey('file_path', $synced->json('data.metadata.reference_images.0'));

        $this->assertSame(2, ExerciseMedia::query()->where('exercise_id', $exercise->id)->count());
    }

    public function test_the_operator_change_reads_the_video_locked_inside_a_transaction(): void
    {
        $admin = AdminUser::factory()->create();
        $video = Video::factory()->create(['status' => Video::STATUS_COMPLETED]);
        $spy   = new class(new Video) extends VideoRepository
        {
            /** @var list<array{id: int, transaction_level: int}> */
            public array $lockedReads = [];

            public function findForUpdate(int $id): Video
            {
                $this->lockedReads[] = ['id' => $id, 'transaction_level' => DB::transactionLevel()];

                return parent::findForUpdate($id);
            }
        };
        $this->app->instance(VideoRepository::class, $spy);
        $levelBefore = DB::transactionLevel();

        $this->actingAs($admin, 'admin')
            ->putJson("/api/admin/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => ['covers/videos/ref-1.jpeg'],
            ])
            ->assertOk();

        $this->assertNotEmpty($spy->lockedReads);
        $this->assertSame($video->id, $spy->lockedReads[0]['id']);
        $this->assertGreaterThan($levelBefore, $spy->lockedReads[0]['transaction_level']);
    }

    public function test_admin_rejects_more_than_two_reference_images(): void
    {
        $admin = AdminUser::factory()->create();
        $video = Video::factory()->create(['status' => Video::STATUS_COMPLETED]);

        $this->actingAs($admin, 'admin')
            ->putJson("/api/admin/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => ['a.jpg', 'b.jpg', 'c.jpg'],
            ])
            ->assertStatus(422);
    }

    public function test_admin_can_clear_reference_images(): void
    {
        $admin = AdminUser::factory()->create();
        $area  = PhysioArea::create(['name' => 'Área Clear']);
        $video = Video::factory()->create(['status' => Video::STATUS_COMPLETED]);

        $exercise = Exercise::create([
            'name'           => 'Limpar mídia',
            'physio_area_id' => $area->id,
            'created_by'     => $admin->id,
            'is_active'      => true,
        ]);
        $exercise->videos()->attach($video->id);

        ExerciseMedia::create([
            'exercise_id'       => $exercise->id,
            'type'              => ExerciseMedia::TYPE_IMAGE,
            'file_path'         => 'old.jpg',
            'cdn_url'           => 'https://cdn.example.com/old.jpg',
            'original_filename' => 'old.jpg',
            'mime_type'         => 'image/jpeg',
            'size'              => 1,
            'sort_order'        => 0,
        ]);

        $this->actingAs($admin, 'admin')
            ->putJson("/api/admin/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => [],
            ])
            ->assertOk();

        $this->assertSame(0, ExerciseMedia::query()->where('exercise_id', $exercise->id)->count());
    }

    public function test_clinic_user_can_sync_reference_images_to_own_exercise(): void
    {
        $clinic = Clinic::factory()->create();
        $user   = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);
        $area  = PhysioArea::create(['name' => 'Área Clínica Ref']);
        $paths = [
            'covers/videos/clinic-ref-1.jpeg',
            'covers/videos/clinic-ref-2.png',
        ];
        $video = Video::factory()->create([
            'clinic_id' => $clinic->id,
            'status'    => Video::STATUS_COMPLETED,
            'metadata'  => ['issued_image_paths' => $paths],
        ]);

        $exercise = Exercise::create([
            'name'                         => 'Envio clínica',
            'physio_area_id'               => $area->id,
            'clinic_id'                    => $clinic->id,
            'submitted_by_clinic_user_id'  => $user->id,
            'review_status'                => Exercise::REVIEW_PENDING,
            'is_active'                    => true,
        ]);
        $exercise->videos()->attach($video->id);

        $syncedClinic = $this->actingAs($user, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => $paths,
            ])
            ->assertOk();
        $this->assertSignedImageUrl($syncedClinic->json('data.metadata.reference_images.0.url'), $paths[0]);

        $this->assertSame(2, ExerciseMedia::query()->where('exercise_id', $exercise->id)->count());
    }

    public function test_clinic_reference_images_publish_event_with_owner_clinic_and_images(): void
    {
        Event::fake([VideoReferenceImagesChanged::class]);

        $clinic = Clinic::factory()->create();
        $user   = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);
        $paths = ['covers/videos/evento-1.jpeg', 'covers/videos/evento-2.png'];
        $video = Video::factory()->create([
            'clinic_id' => $clinic->id,
            'status'    => Video::STATUS_COMPLETED,
            'metadata'  => ['issued_image_paths' => $paths],
        ]);

        $this->actingAs($user, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => $paths,
            ])
            ->assertOk();

        Event::assertDispatchedTimes(VideoReferenceImagesChanged::class, 1);
        Event::assertDispatched(VideoReferenceImagesChanged::class, fn (VideoReferenceImagesChanged $event) => $event->videoId === $video->id
            && $event->ownerClinicId === $clinic->id
            && $event->changedByOperator === false
            && array_column($event->images, 'file_path') === $paths);
    }

    public function test_operator_reference_images_publish_event_marked_as_operator(): void
    {
        Event::fake([VideoReferenceImagesChanged::class]);

        $admin = AdminUser::factory()->create();
        $video = Video::factory()->create(['status' => Video::STATUS_COMPLETED]);

        $this->actingAs($admin, 'admin')
            ->putJson("/api/admin/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => ['covers/videos/catalogo-1.jpeg'],
            ])
            ->assertOk();

        Event::assertDispatched(VideoReferenceImagesChanged::class, fn (VideoReferenceImagesChanged $event) => $event->videoId === $video->id
            && is_null($event->ownerClinicId)
            && $event->changedByOperator === true);
    }

    public function test_clinic_keeps_an_existing_image_by_position_and_adds_a_new_one(): void
    {
        $clinic = Clinic::factory()->create();
        $user   = ClinicUser::factory()->create(['clinic_id' => $clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $video  = Video::factory()->create([
            'clinic_id' => $clinic->id,
            'status'    => Video::STATUS_COMPLETED,
            'metadata'  => [
                'issued_image_paths' => ['covers/videos/nova.jpg'],
                'reference_images'   => [
                    ['file_path' => 'covers/videos/primeira.jpg', 'original_filename' => 'primeira.jpg', 'mime_type' => 'image/jpeg', 'size' => 1],
                    ['file_path' => 'covers/videos/segunda.jpg', 'original_filename' => 'segunda.jpg', 'mime_type' => 'image/jpeg', 'size' => 1],
                ],
            ],
        ]);

        $response = $this->actingAs($user, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", [
                'reference_image_slots' => [
                    ['keep' => 1, 'url' => 'https://conta.example/ivsdev/covers/videos/segunda.jpg?X-Amz-Signature=a'],
                    ['path' => 'covers/videos/nova.jpg'],
                ],
            ])
            ->assertOk();

        $this->assertSignedImageUrl($response->json('data.metadata.reference_images.0.url'), 'covers/videos/segunda.jpg');
        $this->assertSignedImageUrl($response->json('data.metadata.reference_images.1.url'), 'covers/videos/nova.jpg');
        $this->assertSame(
            ['covers/videos/segunda.jpg', 'covers/videos/nova.jpg'],
            array_column($video->fresh()->metadata['reference_images'], 'file_path'),
        );
    }

    public function test_keeping_a_position_whose_image_changed_since_the_screen_opened_is_refused(): void
    {
        $clinic = Clinic::factory()->create();
        $user   = ClinicUser::factory()->create(['clinic_id' => $clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $video  = Video::factory()->create([
            'clinic_id' => $clinic->id,
            'status'    => Video::STATUS_COMPLETED,
            'metadata'  => [
                'issued_image_paths' => ['covers/videos/nova.jpg'],
                'reference_images'   => [
                    ['file_path' => 'covers/videos/primeira.jpg', 'original_filename' => 'primeira.jpg', 'mime_type' => 'image/jpeg', 'size' => 1],
                    ['file_path' => 'covers/videos/trocada.jpg', 'original_filename' => 'trocada.jpg', 'mime_type' => 'image/jpeg', 'size' => 1],
                ],
            ],
        ]);

        $this->actingAs($user, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", [
                'reference_image_slots' => [
                    ['path' => 'covers/videos/nova.jpg'],
                    ['keep' => 1, 'url' => 'https://conta.example/ivsdev/covers/videos/segunda.jpg?X-Amz-Signature=a'],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'As imagens de referência mudaram. Recarregue a tela e tente de novo.']);

        $this->assertSame(
            ['covers/videos/primeira.jpg', 'covers/videos/trocada.jpg'],
            array_column($video->fresh()->metadata['reference_images'], 'file_path'),
        );
    }

    public function test_clinic_cannot_keep_a_position_that_has_no_image(): void
    {
        $clinic = Clinic::factory()->create();
        $user   = ClinicUser::factory()->create(['clinic_id' => $clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $video  = Video::factory()->create([
            'clinic_id' => $clinic->id,
            'status'    => Video::STATUS_COMPLETED,
            'metadata'  => ['reference_images' => [
                ['file_path' => 'covers/videos/unica.jpg', 'original_filename' => 'unica.jpg', 'mime_type' => 'image/jpeg', 'size' => 1],
            ]],
        ]);

        $this->actingAs($user, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", [
                'reference_image_slots' => [['keep' => 1, 'url' => 'https://conta.example/ivsdev/covers/videos/segunda.jpg?X-Amz-Signature=a']],
            ])
            ->assertStatus(422);

        $this->assertSame(['covers/videos/unica.jpg'], array_column($video->fresh()->metadata['reference_images'], 'file_path'));
    }

    public function test_other_clinic_cannot_keep_images_of_this_clinic_video(): void
    {
        $owner = Clinic::factory()->create();
        $other = ClinicUser::factory()->create(['role' => ClinicUser::ROLE_ADMIN]);
        $video = Video::factory()->create([
            'clinic_id' => $owner->id,
            'status'    => Video::STATUS_COMPLETED,
            'metadata'  => ['reference_images' => [
                ['file_path' => 'covers/videos/da-dona.jpg', 'original_filename' => 'da-dona.jpg', 'mime_type' => 'image/jpeg', 'size' => 1],
            ]],
        ]);

        $response = $this->actingAs($other, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", [
                'reference_image_slots' => [['keep' => 0, 'url' => 'https://conta.example/ivsdev/covers/videos/da-dona.jpg?X-Amz-Signature=a']],
            ]);

        $this->assertContains($response->status(), [403, 404]);
        $this->assertStringNotContainsString('da-dona', $response->getContent());
    }
}
