<?php

namespace Tests\Architecture;

use PHPUnit\Framework\TestCase;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

class ModuleBoundaryTest extends TestCase
{
    /**
     * @return array<int, array{file: string, import: string, reason: string}>
     */
    private function findClinicFinanceViolations(): array
    {
        $violations = [];

        foreach ($this->productionPhpFiles('modules/ClinicFinance/app') as $file) {
            $contents = (string) file_get_contents($file->getPathname());
            array_push($violations, ...$this->violationsForContent($file->getPathname(), $contents, 'ClinicFinance'));
        }

        return $violations;
    }

    public function test_clinic_finance_production_code_does_not_import_private_module_internals(): void
    {
        $violations = $this->findClinicFinanceViolations();

        $this->assertSame([], $violations, $this->formatViolations($violations));
    }

    /**
     * @return array<int, array{file: string, import: string, reason: string}>
     */
    private function findClinicSchedulingViolations(): array
    {
        $violations = [];

        foreach ($this->productionPhpFiles('modules/ClinicScheduling/app') as $file) {
            $contents = (string) file_get_contents($file->getPathname());
            array_push($violations, ...$this->violationsForContent($file->getPathname(), $contents, 'ClinicScheduling'));
        }

        return $violations;
    }

    public function test_clinic_scheduling_production_code_does_not_import_private_module_internals(): void
    {
        $violations = $this->findClinicSchedulingViolations();

        $this->assertSame([], $violations, $this->formatViolations($violations));
    }

    public function test_boundary_scanner_detects_synthetic_prohibited_import(): void
    {
        $violations = $this->violationsForContent(
            'modules/ClinicFinance/app/Services/SyntheticService.php',
            "use Modules\\Clinic\\Models\\ClinicUser;\nuse Modules\\Patient\\Repositories\\PatientRepository;\n",
            'ClinicFinance',
        );

        $this->assertNotEmpty($violations);
        $this->assertSame('Modules\\Clinic\\Models\\ClinicUser', $violations[0]['import']);
    }

    public function test_extracted_clinic_capabilities_are_scanned_for_private_imports(): void
    {
        $capabilityMap = require dirname(__DIR__, 2) . '/tests/Architecture/fixtures/clinic-capability-map.php';
        $missing       = [];

        foreach ($capabilityMap['capabilities'] as $capability => $definition) {
            if ($definition['status'] !== 'extracted') {
                continue;
            }

            $modulePath = dirname(__DIR__, 2) . '/modules/' . $definition['module'] . '/app';

            if (!is_dir($modulePath)) {
                $missing[] = "{$capability} expected {$modulePath} to be scanned";
            }
        }

        $this->assertSame([], $missing, implode(PHP_EOL, $missing));
    }

    /**
     * @return array<int, array{file: string, import: string, reason: string}>
     */
    private function violationsForContent(string $path, string $contents, string $ownModule): array
    {
        preg_match_all('/^use\s+Modules\\\\([^\\\\;]+)\\\\([^;]+);/m', $contents, $matches, PREG_SET_ORDER);

        $violations = [];

        foreach ($matches as $match) {
            $module     = $match[1];
            $importTail = $match[2];
            $import     = 'Modules\\' . $module . '\\' . $importTail;

            if ($module === $ownModule) {
                continue;
            }

            if (str_starts_with($importTail, 'Models\\')) {
                $violations[] = [
                    'file'   => $path,
                    'import' => $import,
                    'reason' => 'cross-module model import',
                ];
            }

            if (str_starts_with($importTail, 'Repositories\\')) {
                $violations[] = [
                    'file'   => $path,
                    'import' => $import,
                    'reason' => 'cross-module repository import',
                ];
            }

            if (str_starts_with($importTail, 'Contracts\\') && str_contains($importTail, 'RepositoryInterface')) {
                $violations[] = [
                    'file'   => $path,
                    'import' => $import,
                    'reason' => 'cross-module repository interface import',
                ];
            }
        }

        return $violations;
    }

    /**
     * @return iterable<SplFileInfo>
     */
    private function productionPhpFiles(string $path): iterable
    {
        if (!is_dir($path)) {
            return [];
        }

        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path));

        foreach ($iterator as $file) {
            if ($file instanceof SplFileInfo && $file->isFile() && $file->getExtension() === 'php') {
                yield $file;
            }
        }
    }

    /**
     * @param  array<int, array{file: string, import: string, reason: string}>  $violations
     */
    private function formatViolations(array $violations): string
    {
        if ($violations === []) {
            return '';
        }

        return implode(PHP_EOL, array_map(
            fn (array $violation): string => "{$violation['file']} imports {$violation['import']} ({$violation['reason']})",
            $violations,
        ));
    }
}
