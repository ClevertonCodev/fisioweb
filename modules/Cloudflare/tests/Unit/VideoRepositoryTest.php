<?php

namespace Modules\Cloudflare\Tests\Unit;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Cloudflare\Models\Video;
use Modules\Cloudflare\Repositories\VideoRepository;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VideoRepositoryTest extends TestCase
{
    use RefreshDatabase;

    protected VideoRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = new VideoRepository(new Video());
    }

    #[Test]
    public function create_persists_video_to_database(): void
    {
        $video = $this->repository->create([
            'filename' => 'test_video.mp4',
            'original_filename' => 'meu_video.mp4',
            'path' => 'videos/test_video.mp4',
            'mime_type' => 'video/mp4',
            'size' => 1048576,
            'status' => Video::STATUS_PENDING,
        ]);

        $this->assertInstanceOf(Video::class, $video);
        $this->assertDatabaseHas('videos', [
            'filename' => 'test_video.mp4',
            'original_filename' => 'meu_video.mp4',
            'status' => 'pending',
        ]);
    }

    #[Test]
    public function find_returns_video_by_id(): void
    {
        $created = $this->createVideo();

        $found = $this->repository->find($created->id);

        $this->assertNotNull($found);
        $this->assertEquals($created->id, $found->id);
        $this->assertEquals($created->filename, $found->filename);
    }

    #[Test]
    public function find_returns_null_when_not_found(): void
    {
        $this->assertNull($this->repository->find(999));
    }

    #[Test]
    public function find_or_fail_throws_exception_when_not_found(): void
    {
        $this->expectException(ModelNotFoundException::class);

        $this->repository->findOrFail(999);
    }

    #[Test]
    public function update_modifies_video_record(): void
    {
        $video = $this->createVideo();

        $updated = $this->repository->update($video->id, [
            'status' => Video::STATUS_COMPLETED,
            'url' => 'https://r2.example.com/videos/test.mp4',
        ]);

        $this->assertEquals(Video::STATUS_COMPLETED, $updated->status);
        $this->assertEquals('https://r2.example.com/videos/test.mp4', $updated->url);
        $this->assertDatabaseHas('videos', [
            'id' => $video->id,
            'status' => 'completed',
        ]);
    }

    #[Test]
    public function update_throws_exception_when_not_found(): void
    {
        $this->expectException(ModelNotFoundException::class);

        $this->repository->update(999, ['status' => Video::STATUS_COMPLETED]);
    }

    #[Test]
    public function delete_soft_deletes_video(): void
    {
        $video = $this->createVideo();

        $result = $this->repository->delete($video->id);

        $this->assertTrue($result);
        $this->assertSoftDeleted('videos', ['id' => $video->id]);
    }

    #[Test]
    public function delete_throws_exception_when_not_found(): void
    {
        $this->expectException(ModelNotFoundException::class);

        $this->repository->delete(999);
    }

    #[Test]
    public function force_delete_permanently_removes_video(): void
    {
        $video = $this->createVideo();
        $this->repository->delete($video->id);

        $result = $this->repository->forceDelete($video->id);

        $this->assertTrue($result);
        $this->assertDatabaseMissing('videos', ['id' => $video->id]);
    }

    #[Test]
    public function restore_recovers_soft_deleted_video(): void
    {
        $video = $this->createVideo();
        $this->repository->delete($video->id);

        $result = $this->repository->restore($video->id);

        $this->assertTrue($result);
        $this->assertDatabaseHas('videos', [
            'id' => $video->id,
            'deleted_at' => null,
        ]);
    }

    #[Test]
    public function paginate_returns_paginated_results(): void
    {
        $this->createVideo(['filename' => 'video1.mp4']);
        $this->createVideo(['filename' => 'video2.mp4']);
        $this->createVideo(['filename' => 'video3.mp4']);

        $result = $this->repository->paginate(2);

        $this->assertEquals(2, $result->perPage());
        $this->assertEquals(3, $result->total());
    }

    #[Test]
    public function find_by_status_returns_matching_videos(): void
    {
        $this->createVideo(['status' => Video::STATUS_COMPLETED]);
        $this->createVideo(['status' => Video::STATUS_COMPLETED]);
        $this->createVideo(['status' => Video::STATUS_FAILED]);

        $completed = $this->repository->getCompleted();
        $failed = $this->repository->getFailed();

        $this->assertCount(2, $completed);
        $this->assertCount(1, $failed);
    }

    #[Test]
    public function count_returns_total_videos(): void
    {
        $this->createVideo();
        $this->createVideo();

        $this->assertEquals(2, $this->repository->count());
    }

    #[Test]
    public function get_total_size_sums_all_video_sizes(): void
    {
        $this->createVideo(['size' => 1000]);
        $this->createVideo(['size' => 2000]);
        $this->createVideo(['size' => 3000]);

        $this->assertEquals(6000, $this->repository->getTotalSize());
    }

    #[Test]
    public function get_recent_returns_limited_results(): void
    {
        $this->createVideo(['filename' => 'video1.mp4']);
        $this->createVideo(['filename' => 'video2.mp4']);
        $this->createVideo(['filename' => 'video3.mp4']);

        $recent = $this->repository->getRecent(2);

        $this->assertCount(2, $recent);
    }

    #[Test]
    public function paginate_with_filters_filters_by_status(): void
    {
        $this->createVideo(['status' => Video::STATUS_COMPLETED]);
        $this->createVideo(['status' => Video::STATUS_COMPLETED]);
        $this->createVideo(['status' => Video::STATUS_FAILED]);

        $result = $this->repository->paginateWithFilters(['status' => Video::STATUS_COMPLETED]);

        $this->assertEquals(2, $result->total());
    }

    #[Test]
    public function paginate_with_filters_searches_by_filename(): void
    {
        $this->createVideo(['original_filename' => 'aula_fisioterapia.mp4']);
        $this->createVideo(['original_filename' => 'exercicio_coluna.mp4']);
        $this->createVideo(['original_filename' => 'outro_video.mp4']);

        $result = $this->repository->paginateWithFilters(['search' => 'fisioterapia']);

        $this->assertEquals(1, $result->total());
    }

    protected function createVideo(array $overrides = []): Video
    {
        static $counter = 0;
        $counter++;

        return $this->repository->create(array_merge([
            'filename' => "test_video_{$counter}.mp4",
            'original_filename' => "original_{$counter}.mp4",
            'path' => "videos/test_video_{$counter}.mp4",
            'mime_type' => 'video/mp4',
            'size' => 1048576,
            'status' => Video::STATUS_PENDING,
        ], $overrides));
    }
}
