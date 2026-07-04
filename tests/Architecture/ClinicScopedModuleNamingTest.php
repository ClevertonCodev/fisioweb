<?php

namespace Tests\Architecture;

use PHPUnit\Framework\TestCase;

class ClinicScopedModuleNamingTest extends TestCase
{
    public function test_clinic_scoped_capabilities_use_clinic_prefixed_module_names(): void
    {
        $map           = $this->capabilityMap();
        $prefix        = $map['rules']['clinic_module_prefix'];
        $legacyModules = $map['rules']['legacy_modules'];
        $exceptions    = $map['rules']['bounded_context_name_exceptions'] ?? [];
        $violations    = [];

        foreach ($map['capabilities'] as $capability => $definition) {
            $module = $definition['module'];

            if (in_array($module, $legacyModules, true) || in_array($module, $exceptions, true)) {
                continue;
            }

            if (!str_starts_with($module, $prefix) || $module === $prefix) {
                $violations[] = "{$capability} uses invalid clinic module name {$module}";
            }
        }

        $this->assertSame([], $violations, implode(PHP_EOL, $violations));
    }

    public function test_extracted_clinic_capability_modules_exist_on_disk(): void
    {
        $missing = [];

        foreach ($this->capabilityMap()['capabilities'] as $capability => $definition) {
            if ($definition['status'] !== 'extracted') {
                continue;
            }

            if (!is_dir($this->projectPath('modules/' . $definition['module']))) {
                $missing[] = "{$capability} expected module {$definition['module']} to exist";
            }
        }

        $this->assertSame([], $missing, implode(PHP_EOL, $missing));
    }

    /**
     * @return array<string, mixed>
     */
    private function capabilityMap(): array
    {
        return require $this->projectPath('tests/Architecture/fixtures/clinic-capability-map.php');
    }

    private function projectPath(string $path): string
    {
        return dirname(__DIR__, 2) . '/' . $path;
    }
}
