<?php

namespace Tests\Architecture;

use PHPUnit\Framework\TestCase;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

class NoPublicMediaUrlTest extends TestCase
{
    /** @var array<string, string> */
    private const FORBIDDEN = [
        'getFileCdnUrl'                  => '/\bgetFileCdnUrl\b/',
        'getFileUrl'                     => '/\bgetFileUrl\b/',
        'generateCdnUrl'                 => '/\bgenerateCdnUrl\b/',
        'campo cdn_url'                  => '/\bcdn_url\b/',
        'CLOUDFLARE_CDN_URL'             => '/\bCLOUDFLARE_CDN_URL\b/',
        'url pública do disco'           => '/Storage::disk\([^)]*\)\s*->\s*url\(/',
        'host r2.dev'                    => '/[a-z0-9-]+\.r2\.dev\b/i',
        'serviço externo de QR'          => '/api\.qrserver\.com/i',
        'host de CDN do ivsmed'          => '/\bcdn[a-z0-9-]*\.ivsmed\.com\b/i',
    ];

    public function test_production_code_does_not_publish_a_public_media_address(): void
    {
        $hits = [];

        foreach ($this->productionFiles() as $file) {
            foreach ($this->violations((string) file_get_contents($file)) as $label) {
                $hits[] = "{$file} contém {$label}";
            }
        }

        $this->assertSame([], $hits, implode(PHP_EOL, $hits));
    }

    public function test_scanner_flags_each_public_address_pattern(): void
    {
        $synthetic = <<<'TXT'
            $this->fileService->getFileCdnUrl($path);
            $service->getFileUrl($path);
            $this->generateCdnUrl($key);
            $video->cdn_url;
            CLOUDFLARE_CDN_URL=https://x
            Storage::disk('r2')->url($path);
            https://pub-123abc.r2.dev/videos/a.mp4
            https://api.qrserver.com/v1/create-qr-code/
            https://cdn.ivsmed.com/videos/a.mp4
            TXT;

        $this->assertSame(array_keys(self::FORBIDDEN), $this->violations($synthetic));
        $this->assertSame([], $this->violations('$video->video_url; $patient->photo_path;'));
    }

    /**
     * @return list<string>
     */
    private function violations(string $contents): array
    {
        $found = [];

        foreach (self::FORBIDDEN as $label => $pattern) {
            if (preg_match($pattern, $contents) === 1) {
                $found[] = $label;
            }
        }

        return $found;
    }

    /**
     * @return list<string>
     */
    private function productionFiles(): array
    {
        $root  = dirname(__DIR__, 2);
        $files = [$root . '/.env.example'];
        $roots = [
            $root . '/app',
            $root . '/config',
            $root . '/routes',
            $root . '/database/seeders',
            $root . '/resources/js',
            $root . '/resources/views',
            $root . '/infra',
        ];

        foreach (['app', 'config', 'routes', 'resources', 'database/seeders'] as $folder) {
            foreach (glob($root . '/modules/*/' . $folder) ?: [] as $moduleFolder) {
                $roots[] = $moduleFolder;
            }
        }

        foreach ($roots as $folder) {
            if (!is_dir($folder)) {
                continue;
            }

            foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($folder)) as $file) {
                if (!$file instanceof SplFileInfo || !$file->isFile()) {
                    continue;
                }

                $path = $file->getPathname();
                if (str_contains($path, '/test/') || str_contains($path, '/tests/')) {
                    continue;
                }

                if (preg_match('/\.(php|ts|tsx|js|vue|sh|conf|env|ya?ml)$/', $path) === 1) {
                    $files[] = $path;
                }
            }
        }

        return $files;
    }
}
