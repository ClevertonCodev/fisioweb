<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;

class MakeModuleServiceCommand extends Command
{
    protected $signature = 'modules:makeService {name : The name of the module} {service? : The name of the service}';

    protected $description = 'Create a service inside a module (creates module if it does not exist)';

    public function handle(): int
    {
        $name            = $this->argument('name');
        $serviceName     = $this->argument('service');
        $moduleName      = Str::studly($name);
        $modulePath      = base_path("modules/{$moduleName}");
        $moduleNamespace = "Modules\\{$moduleName}";
        $moduleSlug      = Str::kebab($name);

        $moduleExists = is_dir($modulePath);

        if (! $moduleExists) {
            $this->info("Module {$moduleName} does not exist. Creating module...");
            $this->createModule($moduleName, $modulePath, $moduleNamespace, $moduleSlug);
        }

        $this->createService($moduleName, $modulePath, $moduleNamespace, $serviceName);

        $this->info('Service created successfully!');
        $this->info("Don't forget to run: composer dump-autoload");

        return Command::SUCCESS;
    }

    protected function createModule(string $moduleName, string $modulePath, string $namespace, string $slug): void
    {
        $directories = [
            "{$modulePath}/Providers",
            "{$modulePath}/Services",
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

    protected function createService(string $moduleName, string $modulePath, string $namespace, ?string $name): void
    {
        $serviceName = $name ? Str::studly($name) : Str::singular($moduleName) . 'Service';
        $servicePath = "{$modulePath}/Services/{$serviceName}.php";

        if (file_exists($servicePath)) {
            $this->warn("Service {$serviceName} already exists!");

            return;
        }

        if (! is_dir("{$modulePath}/Services")) {
            mkdir("{$modulePath}/Services", 0755, true);
        }

        $content = <<<PHP
<?php

namespace {$namespace}\Services;

class {$serviceName}
{
    //
}

PHP;

        file_put_contents($servicePath, $content);
        $this->info("Created: Services/{$serviceName}.php");
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
