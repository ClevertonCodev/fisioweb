<?php

namespace Modules\Cloudflare\Tests\Unit;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Modules\Cloudflare\Services\CloudflareR2Service;
use Tests\TestCase;

class CloudflareR2ServiceFileTest extends TestCase
{
    protected CloudflareR2Service $service;

    protected function setUp(): void
    {
        parent::setUp();

        config(['cloudflare.r2_disk' => 'r2']);
        config(['cloudflare.cdn_url' => 'https://cdn.example.com']);
        config(['cloudflare.image_directory' => 'images']);
        config(['cloudflare.thumbnail_directory' => 'thumbnails']);

        Storage::fake('r2');

        $this->service = new CloudflareR2Service();
    }

    public function testShouldStoreFileAndReturnDataOnUploadFile(): void
    {
        $file = UploadedFile::fake()->create('photo.png', 100, 'image/png');

        $result = $this->service->uploadFile($file, 'files');

        $this->assertArrayHasKey('filename', $result);
        $this->assertArrayHasKey('original_filename', $result);
        $this->assertArrayHasKey('path', $result);
        $this->assertArrayHasKey('url', $result);
        $this->assertArrayHasKey('cdn_url', $result);
        $this->assertArrayHasKey('mime_type', $result);
        $this->assertArrayHasKey('size', $result);

        $this->assertEquals('photo.png', $result['original_filename']);
        $this->assertStringStartsWith('files/', $result['path']);
        $this->assertStringContainsString('cdn.example.com', $result['cdn_url']);

        Storage::disk('r2')->assertExists($result['path']);
    }

    public function testShouldGenerateUniqueFilenameOnUploadFile(): void
    {
        $file = UploadedFile::fake()->create('photo.png');

        $result = $this->service->uploadFile($file);

        $this->assertNotEquals('photo.png', $result['filename']);
        $this->assertStringEndsWith('.png', $result['filename']);
    }

    public function testShouldUseCustomDirectoryOnUploadFile(): void
    {
        $file = UploadedFile::fake()->create('photo.jpg');

        $result = $this->service->uploadFile($file, 'custom/path');

        $this->assertStringStartsWith('custom/path/', $result['path']);
        Storage::disk('r2')->assertExists($result['path']);
    }

    public function testShouldThrowExceptionOnStorageFailureOnUploadFile(): void
    {
        Storage::shouldReceive('disk')->with('r2')->andReturnSelf();
        Storage::shouldReceive('putFileAs')->once()->andReturn(false);

        Log::shouldReceive('error')->once();

        $file = UploadedFile::fake()->create('photo.png');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Failed to upload file');

        $this->service->uploadFile($file);
    }

    public function testShouldLogSuccessOnUploadFile(): void
    {
        Log::shouldReceive('info')
            ->once()
            ->withArgs(function ($message, $context) {
                return $message === 'File uploaded successfully'
                    && isset($context['path']);
            });

        $file = UploadedFile::fake()->create('photo.png');

        $this->service->uploadFile($file);
    }

    public function testShouldReturnSuccessAndErrorsOnUploadMultipleFiles(): void
    {
        $file1 = UploadedFile::fake()->create('photo1.png');
        $file2 = UploadedFile::fake()->create('photo2.jpg');

        $result = $this->service->uploadMultipleFiles([$file1, $file2]);

        $this->assertCount(2, $result['success']);
        $this->assertCount(0, $result['errors']);
        $this->assertEquals('photo1.png', $result['success'][0]['original_filename']);
        $this->assertEquals('photo2.jpg', $result['success'][1]['original_filename']);
    }

    public function testShouldCaptureIndividualErrorsOnUploadMultipleFiles(): void
    {
        $file1 = UploadedFile::fake()->create('photo1.png');

        Storage::shouldReceive('disk')->with('r2')->andReturnSelf();
        Storage::shouldReceive('putFileAs')
            ->once()
            ->andReturn(false);

        Log::shouldReceive('error')->once();

        $result = $this->service->uploadMultipleFiles([$file1]);

        $this->assertCount(0, $result['success']);
        $this->assertCount(1, $result['errors']);
        $this->assertEquals('photo1.png', $result['errors'][0]['file']);
    }

    public function testShouldRemoveExistingFileOnDeleteFile(): void
    {
        $file = UploadedFile::fake()->create('photo.png');
        $result = $this->service->uploadFile($file);

        Storage::disk('r2')->assertExists($result['path']);

        $deleted = $this->service->deleteFile($result['path']);

        $this->assertTrue($deleted);
        Storage::disk('r2')->assertMissing($result['path']);
    }

    public function testShouldReturnFalseWhenFileNotFoundOnDeleteFile(): void
    {
        $result = $this->service->deleteFile('non-existent/file.png');

        $this->assertFalse($result);
    }

    public function testShouldReturnTrueForExistingFileOnFileExists(): void
    {
        $file = UploadedFile::fake()->create('photo.png');
        $result = $this->service->uploadFile($file);

        $this->assertTrue($this->service->fileExists($result['path']));
    }

    public function testShouldReturnFalseForMissingFileOnFileExists(): void
    {
        $this->assertFalse($this->service->fileExists('non-existent/file.png'));
    }

    public function testShouldReturnCdnUrlForPathOnGetFileCdnUrl(): void
    {
        $url = $this->service->getFileCdnUrl('images/photo.png');

        $this->assertEquals('https://cdn.example.com/images/photo.png', $url);
    }

    public function testShouldHandleLeadingSlashOnGetFileCdnUrl(): void
    {
        $url = $this->service->getFileCdnUrl('/images/photo.png');

        $this->assertEquals('https://cdn.example.com/images/photo.png', $url);
    }
}
