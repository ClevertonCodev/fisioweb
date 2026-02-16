<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;

class MakeModuleRepositoryCommand extends Command
{
    protected $signature = 'modules:makeRepository {name : The name of the module} {repository? : The name of the repository}';

    protected $description = 'Create a repository inside a module (creates module if it does not exist)';

    public function handle(): int
    {
        $name            = $this->argument('name');
        $repositoryName  = $this->argument('repository');
        $moduleName      = Str::studly($name);
        $modulePath      = base_path("modules/{$moduleName}");
        $moduleNamespace = "Modules\\{$moduleName}";
        $moduleSlug      = Str::kebab($name);

        $moduleExists = is_dir($modulePath);

        if (! $moduleExists) {
            $this->info("Module {$moduleName} does not exist. Creating module...");
            $this->createModule($moduleName, $modulePath, $moduleNamespace, $moduleSlug);
        }

        $this->createRepository($moduleName, $modulePath, $moduleNamespace, $repositoryName);

        $this->info('Repository created successfully!');
        $this->info("Don't forget to run: composer dump-autoload");

        return Command::SUCCESS;
    }

    protected function createModule(string $moduleName, string $modulePath, string $namespace, string $slug): void
    {
        $directories = [
            "{$modulePath}/Providers",
            "{$modulePath}/Repositories",
        ];

        foreach ($directories as $directory) {
            if (! is_dir($directory)) {
                mkdir($directory, 0755, true);
            }
        }

        $this->createServiceProvider($moduleName, $modulePath, $namespace, $slug);
        $this->registerProvider($namespace);
    }

    protected function createServiceProvider(string $moduleName, string $modulePath, string $namespace, string $slug): void
    {
        $providerName = "{$moduleName}ServiceProvider";
        $providerPath = "{$modulePath}/Providers/{$providerName}.php";

        if (file_exists($providerPath)) {
            return;
        }

        $content = <<<PHP
<?php

namespace {$namespace}\Providers;

use Illuminate\Support\ServiceProvider;

class {$providerName} extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        //
    }
}

PHP;

        file_put_contents($providerPath, $content);
        $this->info("Created: Providers/{$providerName}.php");
    }

    protected function createRepository(string $moduleName, string $modulePath, string $namespace, ?string $name): void
    {
        $repositoryName = $name ? Str::studly($name) : Str::singular($moduleName) . 'Repository';
        $repositoryPath = "{$modulePath}/Repositories/{$repositoryName}.php";

        if (file_exists($repositoryPath)) {
            $this->warn("Repository {$repositoryName} already exists!");

            return;
        }

        if (! is_dir("{$modulePath}/Repositories")) {
            mkdir("{$modulePath}/Repositories", 0755, true);
        }

        $content = <<<PHP
<?php

namespace {$namespace}\Repositories;

class {$repositoryName}
{
    //
}

PHP;

        file_put_contents($repositoryPath, $content);
        $this->info("Created: Repositories/{$repositoryName}.php");
    }

    protected function registerProvider(string $namespace): void
    {
        $moduleName    = class_basename($namespace);
        $providerClass = "{$namespace}\\Providers\\{$moduleName}ServiceProvider";
        $providersPath = base_path('bootstrap/providers.php');

        $content = file_get_contents($providersPath);

        if (str_contains($content, $providerClass)) {
            return;
        }

        $content = str_replace(
            '];',
            "    {$providerClass}::class,\n];",
            $content
        );

        file_put_contents($providersPath, $content);
        $this->info('Registered provider in bootstrap/providers.php');
    }
}
