<?php

namespace Tests\Architecture;

use PHPUnit\Framework\TestCase;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

class ClinicGuardAccessTest extends TestCase
{
    /** Módulos cujos controllers atendem rotas `auth:clinic`. */
    private const CLINIC_MODULES = [
        'Clinic',
        'ClinicFinance',
        'ClinicScheduling',
        'ClinicalRecord',
        'ClinicQuestionnaire',
        'TreatmentProgram',
        'GoogleCalendar',
    ];

    /** Exceções legítimas: caminho relativo à raiz => motivo. */
    private const ALLOWED = [
        'modules/Clinic/app/Http/Controllers/Admin/ClinicController.php' => 'impersonação do painel admin emite token no guard clinic',
    ];

    public function test_clinic_controllers_do_not_access_clinic_guard_directly(): void
    {
        $root       = dirname(__DIR__, 2);
        $violations = [];

        foreach (self::CLINIC_MODULES as $module) {
            $dir = "{$root}/modules/{$module}/app/Http/Controllers";
            $this->assertDirectoryExists($dir);

            $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS));

            foreach ($iterator as $file) {
                if (!$file instanceof SplFileInfo || $file->getExtension() !== 'php') {
                    continue;
                }

                $relative = substr($file->getPathname(), strlen($root) + 1);
                if (array_key_exists($relative, self::ALLOWED)) {
                    continue;
                }

                foreach ($this->directGuardLines((string) file_get_contents($file->getPathname())) as $line) {
                    $violations[] = "{$relative}:{$line}";
                }
            }
        }

        $this->assertSame([], $violations, "Controller de clínica acessando o guard `clinic` direto. Estenda App\\Http\\Controllers\\ClinicAuthenticatedController e use clinicUser(), clinicId() ou clinicUserId():\n" . implode("\n", $violations));
    }

    public function test_allowed_exceptions_still_exist(): void
    {
        $root = dirname(__DIR__, 2);

        foreach (array_keys(self::ALLOWED) as $relative) {
            $this->assertFileExists("{$root}/{$relative}", 'Exceção obsoleta em ClinicGuardAccessTest::ALLOWED');
            $this->assertNotSame([], $this->directGuardLines((string) file_get_contents("{$root}/{$relative}")), "{$relative} não acessa mais o guard: remova da lista de exceções");
        }
    }

    public function test_detector_flags_every_direct_clinic_guard_form(): void
    {
        $fixture = require dirname(__DIR__, 2) . '/tests/Architecture/fixtures/clinic-guard-access.php';

        foreach ($fixture['violations'] as $snippet) {
            $this->assertNotSame([], $this->directGuardLines($snippet), "Não detectou: {$snippet}");
        }

        foreach ($fixture['allowed'] as $snippet) {
            $this->assertSame([], $this->directGuardLines($snippet), "Falso positivo: {$snippet}");
        }
    }

    /**
     * Linhas (1-based) que leem o guard `clinic` direto: Auth::guard('clinic'),
     * auth('clinic'), auth()->guard('clinic') e ->user('clinic').
     *
     * @return array<int, int>
     */
    private function directGuardLines(string $contents): array
    {
        $pattern = '/(?:Auth::guard|\bauth|auth\(\)->guard|->user)\(\s*[\'"]clinic[\'"]\s*\)/';
        $lines   = [];

        foreach (preg_split('/\R/', $contents) as $index => $line) {
            if (preg_match($pattern, $line)) {
                $lines[] = $index + 1;
            }
        }

        return $lines;
    }
}
