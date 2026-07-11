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

    /**
     * @return array<int, array{file: string, import: string, reason: string}>
     */
    private function findClinicalRecordViolations(): array
    {
        $violations = [];

        foreach ($this->productionPhpFiles('modules/ClinicalRecord/app') as $file) {
            $contents = (string) file_get_contents($file->getPathname());
            array_push($violations, ...$this->violationsForContent($file->getPathname(), $contents, 'ClinicalRecord'));
        }

        return $violations;
    }

    public function test_clinical_record_production_code_does_not_import_private_module_internals(): void
    {
        $violations = $this->findClinicalRecordViolations();

        $this->assertSame([], $violations, $this->formatViolations($violations));
    }

    /**
     * @return array<int, array{file: string, import: string, reason: string}>
     */
    private function findClinicQuestionnaireViolations(): array
    {
        $violations = [];

        foreach ($this->productionPhpFiles('modules/ClinicQuestionnaire/app') as $file) {
            $contents = (string) file_get_contents($file->getPathname());
            array_push($violations, ...$this->violationsForContent($file->getPathname(), $contents, 'ClinicQuestionnaire'));
        }

        return $violations;
    }

    public function test_clinic_questionnaire_production_code_does_not_import_private_module_internals(): void
    {
        $violations = $this->findClinicQuestionnaireViolations();

        $this->assertSame([], $violations, $this->formatViolations($violations));
    }

    public function test_clinic_has_no_duplicate_questionnaire_route_definitions(): void
    {
        $projectRoot  = dirname(__DIR__, 2);
        $clinicRoutes = (string) file_get_contents($projectRoot . '/modules/Clinic/routes/clinic.php');

        $this->assertStringNotContainsString('questionnaire-templates', $clinicRoutes);
        $this->assertStringNotContainsString('questionnaires', $clinicRoutes);
    }

    /**
     * @return array<int, array{file: string, import: string, reason: string}>
     */
    private function findTreatmentProgramViolations(): array
    {
        $violations = [];

        foreach ($this->productionPhpFiles('modules/TreatmentProgram/app') as $file) {
            $contents = (string) file_get_contents($file->getPathname());
            array_push($violations, ...$this->violationsForContent($file->getPathname(), $contents, 'TreatmentProgram'));
        }

        return $violations;
    }

    public function test_treatment_program_production_code_does_not_import_private_module_internals(): void
    {
        $violations = $this->findTreatmentProgramViolations();

        $this->assertSame([], $violations, $this->formatViolations($violations));
    }

    public function test_clinic_has_no_duplicate_treatment_program_route_definitions(): void
    {
        $projectRoot  = dirname(__DIR__, 2);
        $clinicRoutes = (string) file_get_contents($projectRoot . '/modules/Clinic/routes/clinic.php');

        $this->assertStringNotContainsString('treatment-plans', $clinicRoutes);
        $this->assertStringNotContainsString('program-drafts', $clinicRoutes);
        $this->assertStringNotContainsString("'programs'", $clinicRoutes);
    }

    public function test_treatment_program_controllers_depend_on_service_interfaces(): void
    {
        $controllerPath         = dirname(__DIR__, 2) . '/modules/TreatmentProgram/app/Http/Controllers';
        $concreteDomainServices = ['TreatmentPlanService', 'ProgramDraftService', 'ProgramCatalogReadService', 'TreatmentProgramReadService'];
        $violations             = [];

        foreach ($this->productionPhpFiles($controllerPath) as $file) {
            $contents = (string) file_get_contents($file->getPathname());

            if (!preg_match('/ServiceInterface/', $contents)) {
                $violations[] = $file->getPathname() . ' does not reference a ServiceInterface';
            }

            foreach ($concreteDomainServices as $service) {
                if (preg_match('/protected\s+' . $service . '\s+\$/', $contents) === 1) {
                    $violations[] = $file->getPathname() . " injects concrete {$service} instead of its interface";
                }
            }
        }

        $this->assertSame([], $violations, implode(PHP_EOL, $violations));
    }

    public function test_treatment_program_services_depend_on_repository_interfaces(): void
    {
        $servicePath = dirname(__DIR__, 2) . '/modules/TreatmentProgram/app/Services';
        $violations  = [];

        foreach ($this->productionPhpFiles($servicePath) as $file) {
            $contents = (string) file_get_contents($file->getPathname());

            if (!preg_match('/RepositoryInterface/', $contents)) {
                $violations[] = $file->getPathname() . ' does not reference a RepositoryInterface';
            }
        }

        $this->assertSame([], $violations, implode(PHP_EOL, $violations));
    }

    public function test_clinic_questionnaire_controllers_depend_on_service_interfaces(): void
    {
        $controllerPath = dirname(__DIR__, 2) . '/modules/ClinicQuestionnaire/app/Http/Controllers';
        $violations     = [];

        foreach ($this->productionPhpFiles($controllerPath) as $file) {
            $contents = (string) file_get_contents($file->getPathname());

            if (!preg_match('/ServiceInterface/', $contents)) {
                $violations[] = $file->getPathname() . ' does not reference a ServiceInterface';
            }

            if (preg_match('/protected\s+\w+Service\s+\$/', $contents) === 1) {
                $violations[] = $file->getPathname() . ' injects concrete Service instead of interface';
            }
        }

        $this->assertSame([], $violations, implode(PHP_EOL, $violations));
    }

    public function test_clinic_questionnaire_services_depend_on_repository_interfaces(): void
    {
        $servicePath = dirname(__DIR__, 2) . '/modules/ClinicQuestionnaire/app/Services';
        $violations  = [];

        foreach ($this->productionPhpFiles($servicePath) as $file) {
            $contents = (string) file_get_contents($file->getPathname());

            if (!preg_match('/RepositoryInterface/', $contents)) {
                $violations[] = $file->getPathname() . ' does not reference a RepositoryInterface';
            }
        }

        $this->assertSame([], $violations, implode(PHP_EOL, $violations));
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
