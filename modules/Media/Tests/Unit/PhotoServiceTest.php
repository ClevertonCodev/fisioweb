<?php

namespace Modules\Media\Tests\Unit;

use Illuminate\Http\UploadedFile;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Media\Services\PhotoService;
use Tests\TestCase;

class PhotoServiceTest extends TestCase
{
    protected FileServiceInterface $fileService;

    protected PhotoService $service;

    protected function setUp(): void
    {
        parent::setUp();

        config(['cloudflare.image_directory' => 'images']);

        $this->fileService = $this->mock(FileServiceInterface::class);
        $this->service     = new PhotoService($this->fileService);
    }

    public function test_should_upload_image_delegate_to_file_service_with_default_directory(): void
    {
        $file = UploadedFile::fake()->create('avatar.jpg', 100, 'image/jpeg');

        $expected = [
            'filename'          => 'uuid_123.jpg',
            'original_filename' => 'avatar.jpg',
            'path'              => 'images/uuid_123.jpg',
            'url'               => 'https://r2.example.com/images/uuid_123.jpg',
            'cdn_url'           => 'https://cdn.example.com/images/uuid_123.jpg',
            'mime_type'         => 'image/jpeg',
            'size'              => 102400,
        ];

        $this->fileService
            ->shouldReceive('uploadFile')
            ->once()
            ->with($file, 'images')
            ->andReturn($expected);

        $result = $this->service->uploadImage($file);

        $this->assertEquals($expected, $result);
    }

    public function test_should_upload_image_accept_custom_directory(): void
    {
        $file = UploadedFile::fake()->create('avatar.jpg');

        $this->fileService
            ->shouldReceive('uploadFile')
            ->once()
            ->with($file, 'profile-photos')
            ->andReturn(['path' => 'profile-photos/uuid.jpg']);

        $result = $this->service->uploadImage($file, 'profile-photos');

        $this->assertEquals('profile-photos/uuid.jpg', $result['path']);
    }

    public function test_should_upload_multiple_images_delegate_to_file_service(): void
    {
        $file1 = UploadedFile::fake()->create('photo1.png');
        $file2 = UploadedFile::fake()->create('photo2.jpg');

        $this->fileService
            ->shouldReceive('uploadMultipleFiles')
            ->once()
            ->with([$file1, $file2], 'images')
            ->andReturn([
                'success' => [['path' => 'images/1.png'], ['path' => 'images/2.jpg']],
                'errors'  => [],
            ]);

        $result = $this->service->uploadMultipleImages([$file1, $file2]);

        $this->assertCount(2, $result['success']);
        $this->assertCount(0, $result['errors']);
    }

    public function test_should_throw_not_implemented_for_crud_methods(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('não implementado');

        $this->service->deleteImage(1);
    }

    public function test_should_throw_not_implemented_for_get_image(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('não implementado');

        $this->service->getImage(1);
    }

    public function test_should_throw_not_implemented_for_get_all_images(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('não implementado');

        $this->service->getAllImages();
    }
}
