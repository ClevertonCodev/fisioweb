<?php

namespace Tests\Architecture;

use PHPUnit\Framework\TestCase;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

class NoPublicMediaUrlTest extends TestCase
{
    public function test_production_code_does_not_publish_a_cdn_url(): void
    {
        $hits = [];

        foreach ($this->productionFiles() as $file) {
            $contents = (string) file_get_contents($file);
            foreach (['getFileCdnUrl', 'getFileUrl', 'cdn-dev.ivsmed.com'] as $token) {
                if (str_contains($contents, $token)) {
                    $hits[] = $file . ' contém ' . $token;
                }
            }
        }

        $this->assertSame([], $hits, implode("\n", $hits));
    }

    /**
     * @return list<string>
     */
    private function productionFiles(): array
    {
        $root  = dirname(__DIR__, 2);
        $roots = [
            $root . '/app',
            $root . '/config',
            $root . '/database/seeders',
            $root . '/resources/js',
            $root . '/resources/views',
        ];

        foreach (glob($root . '/modules/*/app') ?: [] as $moduleApp) {
            $roots[] = $moduleApp;
        }
        foreach (glob($root . '/modules/*/database/seeders') ?: [] as $seeders) {
            $roots[] = $seeders;
        }

        $files = [];
        foreach ($roots as $root) {
            if (!is_dir($root)) {
                continue;
            }
            $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root));
            foreach ($iterator as $file) {
                if (!$file instanceof SplFileInfo || !$file->isFile()) {
                    continue;
                }
                $path = $file->getPathname();
                if (str_contains($path, '/tests/') || str_contains($path, '/test/')) {
                    continue;
                }
                $extension = $file->getExtension();
                if (!in_array($extension, ['php', 'ts', 'tsx', 'js', 'vue', 'blade.php'], true) && !str_ends_with($path, '.blade.php')) {
                    if ($extension !== 'php' && !str_ends_with($path, '.ts') && !str_ends_with($path, '.tsx')) {
                        continue;
                    }
                }
                if (!preg_match('/\.(php|ts|tsx|js|vue)$/', $path)) {
                    continue;
                }
                $files[] = $path;
            }
        }

        return $files;
    }
}
