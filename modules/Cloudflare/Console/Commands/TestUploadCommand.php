<?php

namespace Modules\Cloudflare\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Http\UploadedFile;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Media\Contracts\ImageServiceInterface;

class TestUploadCommand extends Command
{
    protected $signature = 'cloudflare:test-upload';

    protected $description = 'Test image and thumbnail upload to Cloudflare R2';

    public function handle(
        ImageServiceInterface $imageService,
        FileServiceInterface $fileService,
    ): int {
        $this->info('Testing image/thumbnail upload to R2...');
        $this->newLine();

        $this->info('[1/4] Uploading image (apple-touch-icon.png)...');
        try {
            $imagePath = public_path('apple-touch-icon.png');
            $imageFile = new UploadedFile($imagePath, 'apple-touch-icon.png', 'image/png', null, true);

            $imageResult = $imageService->uploadImage($imageFile);

            $this->info('  OK Upload successful');
            $this->table(['Key', 'Value'], collect($imageResult)->map(fn ($v, $k) => [$k, $v])->values()->toArray());
        } catch (\Throwable $e) {
            $this->error('  FAIL Image upload failed: '.$e->getMessage());

            return Command::FAILURE;
        }

        $this->newLine();

        $this->info('[2/4] Uploading thumbnail (logo.svg)...');
        try {
            $thumbPath = public_path('logo.svg');
            $thumbFile = new UploadedFile($thumbPath, 'logo.svg', 'image/svg+xml', null, true);

            $thumbResult = $imageService->uploadThumbnail($thumbFile);

            $this->info('  OK Upload successful');
            $this->table(['Key', 'Value'], collect($thumbResult)->map(fn ($v, $k) => [$k, $v])->values()->toArray());
        } catch (\Throwable $e) {
            $this->error('  FAIL Thumbnail upload failed: '.$e->getMessage());

            return Command::FAILURE;
        }

        $this->newLine();

        $this->info('[3/4] Verifying files exist on R2...');
        $imageExists = $fileService->fileExists($imageResult['path']);
        $thumbExists = $fileService->fileExists($thumbResult['path']);

        $this->info('  Image exists: '.($imageExists ? 'YES' : 'NO'));
        $this->info('  Thumbnail exists: '.($thumbExists ? 'YES' : 'NO'));

        if (!$imageExists || !$thumbExists) {
            $this->error('  FAIL Files not found on R2');

            return Command::FAILURE;
        }

        $this->newLine();

        $this->info('[4/4] Cleaning up test files...');
        $fileService->deleteFile($imageResult['path']);
        $fileService->deleteFile($thumbResult['path']);
        $this->info('  OK Files deleted');

        $this->newLine();
        $this->info('All tests passed! Image and thumbnail upload working correctly.');

        return Command::SUCCESS;
    }
}
