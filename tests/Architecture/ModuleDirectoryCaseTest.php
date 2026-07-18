<?php

namespace Tests\Architecture;

use PHPUnit\Framework\TestCase;

/**
 * O phpunit.xml e os PSR-4 dos módulos referenciam diretórios em minúsculo
 * (modules/*\/tests, database/factories, database/seeders, app). Em macOS o
 * filesystem é case-insensitive e um diretório "Tests" continua casando; no
 * Linux do CI não casa, e o glob do PHPUnit falha em silêncio — os testes do
 * módulo somem da suíte sem nenhum erro.
 *
 * A verdade sobre o case vem do git, não do disco: no macOS o disco mentiria.
 */
class ModuleDirectoryCaseTest extends TestCase
{
    public function test_module_subdirectories_are_lowercase(): void
    {
        $violations = [];

        foreach ($this->trackedModulePaths() as $path) {
            $segments = explode('/', $path);

            // modules/<Modulo>/<raiz>/...: só a raiz do módulo é minúscula (app, tests,
            // database, routes...). Abaixo dela o case segue o namespace PSR-4 —
            // app/Services, tests/Unit e database/migrations convivem normalmente.
            if (count($segments) < 4) {
                continue;
            }

            $root = $segments[2];

            if ($root !== strtolower($root)) {
                $violations[] = "modules/{$segments[1]}/{$root} deveria ser minúsculo";
            }
        }

        $violations = array_values(array_unique($violations));

        $this->assertSame([], $violations, implode(PHP_EOL, $violations));
    }

    public function test_every_module_test_directory_is_reachable_by_the_phpunit_glob(): void
    {
        $modulesWithTests = [];

        foreach ($this->trackedModulePaths() as $path) {
            if (preg_match('#^modules/([^/]+)/tests/(Unit|Feature)/#', $path, $matches)) {
                $modulesWithTests[$matches[1]] = true;
            }
        }

        $projectRoot = dirname(__DIR__, 2);
        $unreachable = [];

        foreach (array_keys($modulesWithTests) as $module) {
            foreach (['Unit', 'Feature'] as $suite) {
                $directory = "{$projectRoot}/modules/{$module}/tests/{$suite}";

                if (!is_dir($directory)) {
                    continue;
                }

                // glob() honra o case do disco da mesma forma que o PHPUnit.
                $matched = glob("{$projectRoot}/modules/*/tests/{$suite}", GLOB_ONLYDIR) ?: [];

                if (!in_array($directory, $matched, true)) {
                    $unreachable[] = "modules/{$module}/tests/{$suite}";
                }
            }
        }

        $this->assertSame([], $unreachable, implode(PHP_EOL, $unreachable));
    }

    /**
     * @return list<string>
     */
    private function trackedModulePaths(): array
    {
        exec('git ls-files -- modules 2>/dev/null', $output, $status);

        $this->assertSame(0, $status, 'git ls-files falhou; teste requer repositório git.');
        $this->assertNotEmpty($output, 'Nenhum arquivo rastreado em modules/.');

        return $output;
    }
}
