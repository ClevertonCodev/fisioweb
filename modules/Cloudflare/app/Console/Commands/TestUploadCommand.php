<?php

namespace Modules\Cloudflare\Console\Commands;

use Illuminate\Console\Command;
use Modules\Cloudflare\Contracts\FileServiceInterface;

class TestUploadCommand extends Command
{
    protected $signature = 'cloudflare:test-upload';

    protected $description = 'Test file upload to Cloudflare R2';

    public function handle(FileServiceInterface $fileService): int
    {
        $this->info('Testing file upload to R2...');
        $this->newLine();

        $this->info('[1/3] Creating temporary test file and uploading...');
        try {
            $tempPath = tempnam(sys_get_temp_dir(), 'r2_test_');
            file_put_contents($tempPath, 'R2 upload test - ' . now()->toISOString());

            $result = $fileService->uploadFromPath($tempPath, 'files', 'test-upload.txt');
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }

            $this->info('  OK Upload successful');
            $this->table(['Key', 'Value'], collect($result)->map(fn ($v, $k) => [$k, $v])->values()->toArray());
        } catch (\Throwable $e) {
            if (isset($tempPath) && file_exists($tempPath)) {
                unlink($tempPath);
            }
            $this->error('  FAIL Upload failed: ' . $e->getMessage());

            return Command::FAILURE;
        }

        $this->newLine();

        $this->info('[2/3] Verifying file exists on R2...');
        $exists = $fileService->fileExists($result['path']);
        $this->info('  File exists: ' . ($exists ? 'YES' : 'NO'));

        if (!$exists) {
            $this->error('  FAIL File not found on R2');

            return Command::FAILURE;
        }

        $this->newLine();

        $this->info('[3/3] Cleaning up test file...');
        $fileService->deleteFile($result['path']);
        $this->info('  OK File deleted');

        $this->newLine();
        $this->info('All tests passed! File upload working correctly.');

        return Command::SUCCESS;
    }
}
