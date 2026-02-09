<?php

namespace Modules\Media\Tests\Unit;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Media\Jobs\ProcessVideoUpload;
use Modules\Media\Models\Video;
use Modules\Media\Repositories\VideoRepository;
use Modules\Media\Services\VideoService;
use Tests\TestCase;

class VideoServiceTest extends TestCase
{
    protected VideoRepository $repository;

    protected FileServiceInterface $fileService;

    protected VideoService $service;

    protected function setUp(): void
    {
        parent::setUp();

        config(['cloudflare.video_directory' => 'videos']);

        $this->repository = $this->mock(VideoRepository::class);
        $this->fileService = $this->mock(FileServiceInterface::class);
        $this->service = new VideoService($this->fileService, $this->repository);
    }

    public function testShouldRemoveFromStorageAndDatabaseOnDeleteVideo(): void
    {
        $video = new Video([
            'path' => 'videos/test.mp4',
            'thumbnail_path' => null,
        ]);
        $video->id = 1;

        $this->repository->shouldReceive('findOrFail')->with(1)->andReturn($video);

        $this->fileService->shouldReceive('deleteFile')
            ->with('videos/test.mp4')
            ->once()
            ->andReturn(true);

        $this->repository->shouldReceive('delete')->with(1)->once()->andReturn(true);

        Log::shouldReceive('channel')->with('dated')->andReturnSelf();
        Log::shouldReceive('info')->once();

        $result = $this->service->deleteVideo(1);

        $this->assertTrue($result);
    }

    public function testShouldForceDeleteWhenFlagIsTrueOnDeleteVideo(): void
    {
        $video = new Video([
            'path' => 'videos/test.mp4',
            'thumbnail_path' => null,
        ]);
        $video->id = 1;

        $this->repository->shouldReceive('findOrFail')->with(1)->andReturn($video);

        $this->fileService->shouldReceive('deleteFile')
            ->with('videos/test.mp4')
            ->once()
            ->andReturn(false);

        $this->repository->shouldReceive('forceDelete')->with(1)->once()->andReturn(true);

        Log::shouldReceive('channel')->with('dated')->andReturnSelf();
        Log::shouldReceive('info')->once();

        $result = $this->service->deleteVideo(1, forceDelete: true);

        $this->assertTrue($result);
    }

    public function testShouldThrowExceptionWhenNotFoundOnDeleteVideo(): void
    {
        $this->repository->shouldReceive('findOrFail')->with(999)
            ->andThrow(new \Illuminate\Database\Eloquent\ModelNotFoundException());

        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);

        $this->service->deleteVideo(999);
    }

    public function testShouldAlsoDeleteThumbnailOnDeleteVideo(): void
    {
        $video = new Video([
            'path' => 'videos/test.mp4',
            'thumbnail_path' => 'thumbnails/test.jpg',
        ]);
        $video->id = 1;

        $this->repository->shouldReceive('findOrFail')->with(1)->andReturn($video);

        $this->fileService->shouldReceive('deleteFile')
            ->with('videos/test.mp4')
            ->once()
            ->andReturn(true);

        $this->fileService->shouldReceive('deleteFile')
            ->with('thumbnails/test.jpg')
            ->once()
            ->andReturn(true);

        $this->repository->shouldReceive('delete')->with(1)->once()->andReturn(true);

        Log::shouldReceive('channel')->with('dated')->andReturnSelf();
        Log::shouldReceive('info')->once();

        $this->service->deleteVideo(1);
    }

    public function testShouldReturnVideoFromRepositoryOnGetVideo(): void
    {
        $video = new Video();
        $video->id = 1;

        $this->repository->shouldReceive('find')->with(1)->andReturn($video);

        $result = $this->service->getVideo(1);

        $this->assertInstanceOf(Video::class, $result);
        $this->assertEquals(1, $result->id);
    }

    public function testShouldReturnNullWhenNotFoundOnGetVideo(): void
    {
        $this->repository->shouldReceive('find')->with(999)->andReturn(null);

        $this->assertNull($this->service->getVideo(999));
    }

    public function testShouldReturnCdnUrlOnGetVideoCdnUrl(): void
    {
        $video = new Video(['cdn_url' => 'https://cdn.example.com/videos/test.mp4']);
        $video->id = 1;

        $this->repository->shouldReceive('find')->with(1)->andReturn($video);

        $result = $this->service->getVideoCdnUrl(1);

        $this->assertEquals('https://cdn.example.com/videos/test.mp4', $result);
    }

    public function testShouldReturnNullWhenNotFoundOnGetVideoCdnUrl(): void
    {
        $this->repository->shouldReceive('find')->with(999)->andReturn(null);

        $this->assertNull($this->service->getVideoCdnUrl(999));
    }

    public function testShouldMergeWithExistingMetadataOnUpdateMetadata(): void
    {
        $video = new Video(['metadata' => ['key1' => 'value1']]);
        $video->id = 1;

        $updatedVideo = new Video(['metadata' => ['key1' => 'value1', 'key2' => 'value2']]);
        $updatedVideo->id = 1;

        $this->repository->shouldReceive('findOrFail')->with(1)->andReturn($video);
        $this->repository
            ->shouldReceive('update')
            ->once()
            ->withArgs(function ($id, $data) {
                return $id === 1
                    && $data['metadata'] === ['key1' => 'value1', 'key2' => 'value2'];
            })
            ->andReturn($updatedVideo);

        $result = $this->service->updateMetadata(1, ['key2' => 'value2']);

        $this->assertEquals(['key1' => 'value1', 'key2' => 'value2'], $result->metadata);
    }

    public function testShouldHandleNullExistingMetadataOnUpdateMetadata(): void
    {
        $video = new Video(['metadata' => null]);
        $video->id = 1;

        $updatedVideo = new Video(['metadata' => ['key1' => 'value1']]);
        $updatedVideo->id = 1;

        $this->repository->shouldReceive('findOrFail')->with(1)->andReturn($video);
        $this->repository
            ->shouldReceive('update')
            ->once()
            ->withArgs(function ($id, $data) {
                return $data['metadata'] === ['key1' => 'value1'];
            })
            ->andReturn($updatedVideo);

        $result = $this->service->updateMetadata(1, ['key1' => 'value1']);

        $this->assertEquals(['key1' => 'value1'], $result->metadata);
    }

    public function testShouldThrowExceptionWhenNotFoundOnUpdateMetadata(): void
    {
        $this->repository->shouldReceive('findOrFail')->with(999)
            ->andThrow(new \Illuminate\Database\Eloquent\ModelNotFoundException());

        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);

        $this->service->updateMetadata(999, ['key' => 'value']);
    }

    public function testShouldDelegateToRepositoryOnGetAllVideos(): void
    {
        $paginator = $this->mock(\Illuminate\Contracts\Pagination\LengthAwarePaginator::class);

        $this->repository->shouldReceive('paginate')->with(20)->once()->andReturn($paginator);

        $result = $this->service->getAllVideos(20);

        $this->assertSame($paginator, $result);
    }

    public function testShouldStoreLocallyAndDispatchJobOnDispatchUpload(): void
    {
        Queue::fake();
        Storage::fake('local');

        $file = UploadedFile::fake()->create('video.mp4', 5000, 'video/mp4');

        $pendingVideo = new Video([
            'filename' => 'video.mp4',
            'status' => Video::STATUS_PENDING,
        ]);
        $pendingVideo->id = 1;

        $this->repository
            ->shouldReceive('create')
            ->once()
            ->withArgs(function ($data) {
                return $data['original_filename'] === 'video.mp4'
                    && $data['status'] === Video::STATUS_PENDING;
            })
            ->andReturn($pendingVideo);

        Log::shouldReceive('channel')->with('dated')->andReturnSelf();
        Log::shouldReceive('info')->once();

        $result = $this->service->dispatchUpload($file);

        $this->assertIsArray($result);
        $this->assertEquals(Video::STATUS_PENDING, $result['status']);
        $this->assertEquals('video.mp4', $result['filename']);

        Queue::assertPushed(ProcessVideoUpload::class, function ($job) {
            return $job->videoId === 1
                && $job->directory === 'videos'
                && $job->originalFilename === 'video.mp4';
        });
    }

    public function testShouldDispatchMultipleJobsOnDispatchMultipleUploads(): void
    {
        Queue::fake();
        Storage::fake('local');

        $file1 = UploadedFile::fake()->create('video1.mp4', 5000, 'video/mp4');
        $file2 = UploadedFile::fake()->create('video2.mp4', 5000, 'video/mp4');

        $video1 = new Video(['status' => Video::STATUS_PENDING]);
        $video1->id = 1;

        $video2 = new Video(['status' => Video::STATUS_PENDING]);
        $video2->id = 2;

        $this->repository->shouldReceive('create')->twice()->andReturn($video1, $video2);

        Log::shouldReceive('channel')->with('dated')->andReturnSelf();
        Log::shouldReceive('info')->twice();

        $result = $this->service->dispatchMultipleUploads([$file1, $file2]);

        $this->assertEquals(2, $result['queued']);
        $this->assertCount(2, $result['videos']);

        Queue::assertPushed(ProcessVideoUpload::class, 2);
    }

    public function testShouldCreateVideoWithPendingStatusOnDispatchUpload(): void
    {
        Queue::fake();
        Storage::fake('local');

        $file = UploadedFile::fake()->create('video.mp4', 5000, 'video/mp4');

        $pendingVideo = new Video(['status' => Video::STATUS_PENDING]);
        $pendingVideo->id = 1;

        $this->repository
            ->shouldReceive('create')
            ->once()
            ->withArgs(function ($data) {
                return $data['status'] === Video::STATUS_PENDING
                    && $data['path'] === ''
                    && $data['mime_type'] === 'video/mp4';
            })
            ->andReturn($pendingVideo);

        Log::shouldReceive('channel')->with('dated')->andReturnSelf();
        Log::shouldReceive('info')->once();

        $this->service->dispatchUpload($file);
    }
}
