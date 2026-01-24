<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;

class MakeModuleModelCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'modules:makeModel {name : The name of the module} {model? : The name of the model}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a model inside a module (creates module if it does not exist)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $name = $this->argument('name');
        $modelName = $this->argument('model');
        $moduleName = Str::studly($name);
        $modulePath = base_path("modules/{$moduleName}");
        $moduleNamespace = "Modules\\{$moduleName}";
        $moduleSlug = Str::kebab($name);

        $moduleExists = is_dir($modulePath);

        if (!$moduleExists) {
            $this->info("Module {$moduleName} does not exist. Creating module...");
            $this->createModule($moduleName, $modulePath, $moduleNamespace, $moduleSlug);
        } else {
            $this->info("Module {$moduleName} exists. Creating model...");
        }

        $this->createModel($moduleName, $modulePath, $moduleNamespace, $modelName);

        $this->info('Model created successfully!');
        $this->info("Don't forget to run: composer dump-autoload");

        return Command::SUCCESS;
    }

    /**
     * Create the full module structure.
     */
    protected function createModule(string $moduleName, string $modulePath, string $namespace, string $slug): void
    {
        $this->createDirectories($modulePath);
        $this->createServiceProvider($moduleName, $modulePath, $namespace, $slug);
        $this->registerProvider($namespace);
    }

    /**
     * Create module directory structure.
     */
    protected function createDirectories(string $modulePath): void
    {
        $directories = [
            "{$modulePath}/Providers",
            "{$modulePath}/Http/Controllers",
            "{$modulePath}/Models",
            "{$modulePath}/database/migrations",
            "{$modulePath}/database/factories",
            "{$modulePath}/database/seeders",
            "{$modulePath}/routes",
            "{$modulePath}/resources/views",
            "{$modulePath}/tests/Feature",
            "{$modulePath}/tests/Unit",
        ];

        foreach ($directories as $directory) {
            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }
        }
    }

    /**
     * Create Service Provider.
     */
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
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (is_dir(__DIR__.'/../database/migrations')) {
            \$this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        }
        if (file_exists(__DIR__.'/../routes/web.php')) {
            \$this->loadRoutesFrom(__DIR__.'/../routes/web.php');
        }
        if (is_dir(__DIR__.'/../resources/views')) {
            \$this->loadViewsFrom(__DIR__.'/../resources/views', '{$slug}');
        }
    }
}

PHP;

        file_put_contents($providerPath, $content);
        $this->info("Created: Providers/{$providerName}.php");
    }

    /**
     * Create Model.
     */
    protected function createModel(string $moduleName, string $modulePath, string $namespace, ?string $name): void
    {
        $modelName = $name ? Str::studly($name) : Str::singular($moduleName);
        $modelPath = "{$modulePath}/Models/{$modelName}.php";
        $tableName = Str::snake(Str::plural($modelName));

        if (file_exists($modelPath)) {
            $this->warn("Model {$modelName} already exists!");

            return;
        }

        $content = <<<PHP
<?php

namespace {$namespace}\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class {$modelName} extends Model
{
    use HasFactory;

    protected \$table = '{$tableName}';

    protected \$fillable = [
        //
    ];
}

PHP;

        file_put_contents($modelPath, $content);
        $this->info("Created: Models/{$modelName}.php");
    }

    /**
     * Register Service Provider in bootstrap/providers.php.
     */
    protected function registerProvider(string $namespace): void
    {
        $moduleName = class_basename($namespace);
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
