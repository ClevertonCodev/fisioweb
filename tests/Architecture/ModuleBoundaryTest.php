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
            if (!str_ends_with($file->getFilename(), 'Service.php')) {
                continue;
            }

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

    public function test_media_production_code_does_not_reference_admin_module(): void
    {
        $violations = [];

        foreach ($this->productionPhpFiles(dirname(__DIR__, 2) . '/modules/Media') as $file) {
            if (str_contains($file->getPathname(), '/modules/Media/tests/')) {
                continue;
            }

            $contents = (string) file_get_contents($file->getPathname());

            if (preg_match_all('/\\\\{0,2}Modules(?:\\\\){1,2}Admin(?:\\\\){1,2}[A-Za-z0-9_\\\\]+/', $contents, $matches) > 0) {
                foreach (array_unique($matches[0]) as $reference) {
                    $violations[] = $file->getPathname() . ' references ' . $reference;
                }
            }
        }

        $this->assertSame([], $violations, implode(PHP_EOL, $violations));
    }

    public function test_email_module_only_uses_public_contracts_and_events_of_other_modules(): void
    {
        $violations = [];

        $scanned = 0;

        foreach ($this->productionPhpFiles('modules/Email/app') as $file) {
            $scanned++;
            $contents = (string) file_get_contents($file->getPathname());
            array_push($violations, ...$this->emailViolationsForContent($file->getPathname(), $contents));
        }

        $this->assertGreaterThan(0, $scanned);
        $this->assertSame([], $violations, implode(PHP_EOL, $violations));
    }

    public function test_email_scanner_detects_inline_reference_to_another_module_model(): void
    {
        $violations = $this->emailViolationsForContent(
            'modules/Email/app/Listeners/Synthetic.php',
            "\$patient = \\Modules\\Patient\\Models\\Patient::find(1);\nuse Modules\\Patient\\Contracts\\Public\\Allowed;\n",
        );

        $this->assertSame(['modules/Email/app/Listeners/Synthetic.php references Modules\\Patient\\Models\\Patient'], $violations);
    }

    public function test_email_scanner_detects_group_use_namespace_alias_and_raw_table_access(): void
    {
        $violations = $this->emailViolationsForContent(
            'modules/Email/app/Listeners/Synthetic.php',
            "use Modules\\Patient\\{Models\\Patient};\nuse Modules\\Clinic as C;\n\$rows = DB::table('patients')->get();\n",
        );

        $this->assertCount(3, $violations, implode(PHP_EOL, $violations));
    }

    public function test_email_scanner_detects_root_group_use_raw_queries_and_lowercase_namespace(): void
    {
        $cases = [
            "use Modules\\{Patient\\Models\\Patient};\n",
            "\$rows = DB::select('select * from patients');\n",
            "\$rows = DB::query()->from('patients')->get();\n",
            "use modules\\patient\\Models\\Patient;\n",
            "use Modules as M;\n",
            "namespace X {\n    use Modules\\Clinic as C;\n}\n",
            "protected \$table = 'clinic_patients';\n",
            "\$rows = DB::table('patients')->get();\n",
        ];

        foreach ($cases as $content) {
            $this->assertNotSame([], $this->emailViolationsForContent('modules/Email/app/Synthetic.php', $content), $content);
        }
    }

    public function test_email_scanner_allows_the_email_module_own_tables(): void
    {
        $content = "protected \$table = 'email_appointment_reminders';\nDB::table('email_appointment_reminders')->insert([]);\n";

        $this->assertSame([], $this->emailViolationsForContent('modules/Email/app/Models/Synthetic.php', $content));
    }

    public function test_email_scanner_ignores_the_mail_sender_address(): void
    {
        $this->assertSame([], $this->emailViolationsForContent('modules/Email/app/Mail/Synthetic.php', "\$mail->from('naoresponda@ivsmed.com');\n"));
    }

    /**
     * @return list<string>
     */
    private function emailViolationsForContent(string $path, string $contents): array
    {
        preg_match_all('/(?<![A-Za-z0-9_]\\\\)(?<![A-Za-z0-9_])Modules(?:\\\\){1,2}([A-Za-z0-9_]+)(?:\\\\){1,2}([A-Za-z0-9_\\\\]+)/i', $contents, $matches, PREG_SET_ORDER);

        $violations = [];

        foreach ($matches as $match) {
            $module = $match[1];
            $tail   = str_replace('\\\\', '\\', $match[2]);

            if (strcasecmp($module, 'Email') === 0) {
                continue;
            }

            foreach (['Contracts\\Public\\', 'Data\\Public\\', 'Events\\'] as $allowed) {
                if (stripos($tail, $allowed) === 0) {
                    continue 2;
                }
            }

            $violations[] = $path . ' references Modules\\' . $module . '\\' . $tail;
        }

        if (preg_match('/^\s*use\s+Modules\s*(?:\\\\\s*\{|\s+as\s)/mi', $contents) === 1) {
            $violations[] = $path . ' imports from the Modules root as a group';
        }

        preg_match_all('/^\s*use\s+Modules\\\\([A-Za-z0-9_]+)\s*(?:\\\\\s*\{|\s+as\s|;)/mi', $contents, $groupOrAlias, PREG_SET_ORDER);

        foreach ($groupOrAlias as $match) {
            if (strcasecmp($match[1], 'Email') !== 0) {
                $violations[] = $path . ' imports the namespace of Modules\\' . $match[1] . ' as a group or alias';
            }
        }

        if (preg_match('/DB::(?:select|statement|raw|unprepared|insert|update|delete|query)\s*\(/i', $contents) === 1) {
            $violations[] = $path . ' runs a raw query';
        }

        preg_match_all('/(?:DB::table|->table|->from)\s*\(\s*[\'"]([^\'"]+)[\'"]|\$table\s*=\s*[\'"]([^\'"]+)[\'"]/i', $contents, $tables, PREG_SET_ORDER);

        foreach ($tables as $table) {
            $name = !empty($table[2] ?? '') ? $table[2] : $table[1];
            if (str_contains($name, '@')) {
                continue;
            }
            if (!str_starts_with(strtolower($name), 'email_')) {
                $violations[] = $path . ' uses the table ' . $name . ' of another module';
            }
        }

        return array_values(array_unique($violations));
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
