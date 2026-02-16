<?php

namespace Modules\Cloudflare\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Http\UploadedFile;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Media\Contracts\ImageServiceInterface;

class TestUploadCommand extends Command
{
    protected $signature = 'cloudflare:test-upload';

    protected $description = 'Test image upload to Cloudflare R2';

    public function handle(
        ImageServiceInterface $imageService,
        FileServiceInterface $fileService,
    ): int {
        $this->info('Testing image upload to R2...');
        $this->newLine();

        $this->info('[1/3] Uploading image (apple-touch-icon.png)...');
        try {
            $imagePath = public_path('apple-touch-icon.png');
            $imageFile = new UploadedFile($imagePath, 'apple-touch-icon.png', 'image/png', null, true);

            $imageResult = $imageService->uploadImage($imageFile);

            $this->info('  OK Upload successful');
            $this->table(['Key', 'Value'], collect($imageResult)->map(fn ($v, $k) => [$k, $v])->values()->toArray());
        } catch (\Throwable $e) {
            $this->error('  FAIL Image upload failed: ' . $e->getMessage());

            return Command::FAILURE;
        }

        $this->newLine();

        $this->info('[2/3] Verifying file exists on R2...');
        $imageExists = $fileService->fileExists($imageResult['path']);

        $this->info('  Image exists: ' . ($imageExists ? 'YES' : 'NO'));

        if (! $imageExists) {
            $this->error('  FAIL File not found on R2');

            return Command::FAILURE;
        }

        $this->newLine();

        $this->info('[3/3] Cleaning up test file...');
        $fileService->deleteFile($imageResult['path']);
        $this->info('  OK File deleted');

        $this->newLine();
        $this->info('All tests passed! Image upload working correctly.');

        return Command::SUCCESS;
    }
}
