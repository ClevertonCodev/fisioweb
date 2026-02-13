<?php

namespace Modules\Media\Tests\Unit;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Media\Models\Video;
use Modules\Media\Repositories\VideoRepository;
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

    public function testShouldPersistVideoToDatabaseOnCreate(): void
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

    public function testShouldReturnVideoByIdOnFind(): void
    {
        $created = $this->createVideo();

        $found = $this->repository->find($created->id);

        $this->assertNotNull($found);
        $this->assertEquals($created->id, $found->id);
        $this->assertEquals($created->filename, $found->filename);
    }

    public function testShouldReturnNullWhenFindNotFound(): void
    {
        $this->assertNull($this->repository->find(999));
    }

    public function testShouldThrowExceptionWhenFindOrFailNotFound(): void
    {
        $this->expectException(ModelNotFoundException::class);

        $this->repository->findOrFail(999);
    }

    public function testShouldModifyVideoRecordOnUpdate(): void
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

    public function testShouldThrowExceptionWhenUpdateNotFound(): void
    {
        $this->expectException(ModelNotFoundException::class);

        $this->repository->update(999, ['status' => Video::STATUS_COMPLETED]);
    }

    public function testShouldSoftDeleteVideoOnDelete(): void
    {
        $video = $this->createVideo();

        $result = $this->repository->delete($video->id);

        $this->assertTrue($result);
        $this->assertSoftDeleted('videos', ['id' => $video->id]);
    }

    public function testShouldThrowExceptionWhenDeleteNotFound(): void
    {
        $this->expectException(ModelNotFoundException::class);

        $this->repository->delete(999);
    }

    public function testShouldPermanentlyRemoveVideoOnForceDelete(): void
    {
        $video = $this->createVideo();
        $this->repository->delete($video->id);

        $result = $this->repository->forceDelete($video->id);

        $this->assertTrue($result);
        $this->assertDatabaseMissing('videos', ['id' => $video->id]);
    }

    public function testShouldRecoverSoftDeletedVideoOnRestore(): void
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

    public function testShouldReturnPaginatedResultsOnPaginate(): void
    {
        $this->createVideo(['filename' => 'video1.mp4']);
        $this->createVideo(['filename' => 'video2.mp4']);
        $this->createVideo(['filename' => 'video3.mp4']);

        $result = $this->repository->paginate(2);

        $this->assertEquals(2, $result->perPage());
        $this->assertEquals(3, $result->total());
    }

    public function testShouldReturnMatchingVideosByStatus(): void
    {
        $this->createVideo(['status' => Video::STATUS_COMPLETED]);
        $this->createVideo(['status' => Video::STATUS_COMPLETED]);
        $this->createVideo(['status' => Video::STATUS_FAILED]);

        $completed = $this->repository->getCompleted();
        $failed = $this->repository->getFailed();

        $this->assertCount(2, $completed);
        $this->assertCount(1, $failed);
    }

    public function testShouldReturnTotalVideosCount(): void
    {
        $this->createVideo();
        $this->createVideo();

        $this->assertEquals(2, $this->repository->count());
    }

    public function testShouldSumAllVideoSizesOnGetTotalSize(): void
    {
        $this->createVideo(['size' => 1000]);
        $this->createVideo(['size' => 2000]);
        $this->createVideo(['size' => 3000]);

        $this->assertEquals(6000, $this->repository->getTotalSize());
    }

    public function testShouldReturnLimitedResultsOnGetRecent(): void
    {
        $this->createVideo(['filename' => 'video1.mp4']);
        $this->createVideo(['filename' => 'video2.mp4']);
        $this->createVideo(['filename' => 'video3.mp4']);

        $recent = $this->repository->getRecent(2);

        $this->assertCount(2, $recent);
    }

    public function testShouldFilterByStatusOnPaginateWithFilters(): void
    {
        $this->createVideo(['status' => Video::STATUS_COMPLETED]);
        $this->createVideo(['status' => Video::STATUS_COMPLETED]);
        $this->createVideo(['status' => Video::STATUS_FAILED]);

        $result = $this->repository->paginateWithFilters(['status' => Video::STATUS_COMPLETED]);

        $this->assertEquals(2, $result->total());
    }

    public function testShouldSearchByFilenameOnPaginateWithFilters(): void
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
        ++$counter;

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
