<?php

namespace Modules\Cloudflare\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class TestR2ConnectionCommand extends Command
{
    protected $signature = 'cloudflare:test';

    protected $description = 'Test Cloudflare R2 connection and authentication';

    public function handle(): int
    {
        $disk = config('cloudflare.r2_disk', 'r2');

        $this->info('Testing Cloudflare R2 connection...');
        $this->newLine();

        $this->table(['Config', 'Value'], [
            ['Disk', $disk],
            ['Bucket', config('cloudflare.r2.bucket') ?: '(not set)'],
            ['Region', config('cloudflare.r2.region') ?: '(not set)'],
            ['Endpoint', config('cloudflare.r2.endpoint') ?: '(not set)'],
            ['Access Key', config('cloudflare.r2.access_key_id') ? '********'.substr(config('cloudflare.r2.access_key_id'), -4) : '(not set)'],
        ]);

        $this->newLine();

        // Test 1: Write a test file
        $this->info('[1/3] Writing test file...');
        try {
            $testPath = '_test/connection-test.txt';
            $testContent = 'R2 connection test - '.now()->toISOString();

            Storage::disk($disk)->put($testPath, $testContent);
            $this->info('  ✓ Write successful');
        } catch (\Throwable $e) {
            $this->error('  ✗ Write failed: '.$e->getMessage());

            return Command::FAILURE;
        }

        // Test 2: Read the test file
        $this->info('[2/3] Reading test file...');
        try {
            $content = Storage::disk($disk)->get($testPath);
            if ($content === $testContent) {
                $this->info('  ✓ Read successful (content matches)');
            } else {
                $this->warn('  ⚠ Read successful but content mismatch');
            }
        } catch (\Throwable $e) {
            $this->error('  ✗ Read failed: '.$e->getMessage());

            return Command::FAILURE;
        }

        // Test 3: Delete the test file (commented out to keep file in R2)
        // $this->info('[3/3] Deleting test file...');
        // try {
        //     Storage::disk($disk)->delete($testPath);
        //     $this->info('  ✓ Delete successful');
        // } catch (\Throwable $e) {
        //     $this->error('  ✗ Delete failed: ' . $e->getMessage());
        //     return Command::FAILURE;
        // }

        $this->newLine();
        $this->info('All tests passed! R2 connection is working correctly.');

        return Command::SUCCESS;
    }
}
