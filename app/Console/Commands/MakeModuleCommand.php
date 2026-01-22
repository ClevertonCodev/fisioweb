<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;

class MakeModuleCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'modules:make {name : The name of the module}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new Laravel module structure';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $name = $this->argument('name');
        $moduleName = Str::studly($name);
        $modulePath = base_path("modules/{$moduleName}");
        $moduleNamespace = "Modules\\{$moduleName}";
        $moduleSlug = Str::kebab($name);

        // Verificar se o módulo já existe
        if (is_dir($modulePath)) {
            $this->error("Module {$moduleName} already exists!");

            return Command::FAILURE;
        }

        $this->info("Creating module: {$moduleName}...");

        // Criar estrutura de diretórios
        $this->createDirectories($modulePath);

        // Criar Service Provider
        $this->createServiceProvider($moduleName, $modulePath, $moduleNamespace, $moduleSlug);

        // Criar Controller
        $this->createController($moduleName, $modulePath, $moduleNamespace, $moduleSlug);

        // Criar Model
        $this->createModel($moduleName, $modulePath, $moduleNamespace);

        // Criar Migration
        $this->createMigration($moduleName, $modulePath, $moduleSlug);

        // Criar Routes
        $this->createRoutes($moduleName, $modulePath, $moduleNamespace, $moduleSlug);

        // Criar Views
        $this->createViews($modulePath, $moduleSlug);

        // Criar Factory
        $this->createFactory($moduleName, $modulePath, $moduleNamespace);

        // Criar Seeder
        $this->createSeeder($moduleName, $modulePath, $moduleNamespace);

        // Criar Testes
        $this->createTests($moduleName, $modulePath, $moduleNamespace, $moduleSlug);

        // Registrar no bootstrap/providers.php
        $this->registerProvider($moduleNamespace);

        $this->info("Module {$moduleName} created successfully!");
        $this->info("Don't forget to run: composer dump-autoload");

        return Command::SUCCESS;
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
        \$this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        \$this->loadRoutesFrom(__DIR__.'/../routes/web.php');
        \$this->loadViewsFrom(__DIR__.'/../resources/views', '{$slug}');
    }
}

PHP;

        file_put_contents($providerPath, $content);
        $this->info("Created: {$providerName}.php");
    }

    /**
     * Create Controller.
     */
    protected function createController(string $moduleName, string $modulePath, string $namespace, string $slug): void
    {
        $controllerName = Str::singular($moduleName).'Controller';
        $modelName = Str::singular($moduleName);
        $controllerPath = "{$modulePath}/Http/Controllers/{$controllerName}.php";

        $content = <<<PHP
<?php

namespace {$namespace}\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\\{$moduleName}\Models\\{$modelName};

class {$controllerName} extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('{$slug}/index', [
            //
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('{$slug}/create', [
            //
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request \$request): RedirectResponse
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string \$id): Response
    {
        return Inertia::render('{$slug}/show', [
            //
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string \$id): Response
    {
        return Inertia::render('{$slug}/edit', [
            //
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request \$request, string \$id): RedirectResponse
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string \$id): RedirectResponse
    {
        //
    }
}

PHP;

        file_put_contents($controllerPath, $content);
        $this->info("Created: {$controllerName}.php");
    }

    /**
     * Create Model.
     */
    protected function createModel(string $moduleName, string $modulePath, string $namespace): void
    {
        $modelName = Str::singular($moduleName);
        $modelPath = "{$modulePath}/Models/{$modelName}.php";
        $tableName = Str::snake(Str::plural($modelName));

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

    /**
     * Create a new factory instance for the model.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory<static>
     */
    protected static function newFactory()
    {
        return \Modules\\{$moduleName}\Database\Factories\\{$modelName}Factory::new();
    }
}

PHP;

        file_put_contents($modelPath, $content);
        $this->info("Created: {$modelName}.php");
    }

    /**
     * Create Migration.
     */
    protected function createMigration(string $moduleName, string $modulePath, string $slug): void
    {
        $modelName = Str::singular($moduleName);
        $tableName = Str::snake(Str::plural($modelName));
        $migrationName = date('Y_m_d_His').'_create_'.$tableName.'_table.php';
        $migrationPath = "{$modulePath}/database/migrations/{$migrationName}";
        $className = 'Create'.Str::studly($tableName).'Table';

        $content = <<<PHP
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('{$tableName}', function (Blueprint \$table) {
            \$table->id();
            \$table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('{$tableName}');
    }
};

PHP;

        file_put_contents($migrationPath, $content);
        $this->info("Created: {$migrationName}");
    }

    /**
     * Create Routes.
     */
    protected function createRoutes(string $moduleName, string $modulePath, string $namespace, string $slug): void
    {
        $controllerName = Str::singular($moduleName).'Controller';
        $routesPath = "{$modulePath}/routes/web.php";

        $content = <<<PHP
<?php

use Illuminate\Support\Facades\Route;
use {$namespace}\Http\Controllers\\{$controllerName};

Route::prefix('{$slug}')->name('{$slug}.')->group(function () {
    Route::get('/', [{$controllerName}::class, 'index'])->name('index');
    Route::get('/create', [{$controllerName}::class, 'create'])->name('create');
    Route::post('/', [{$controllerName}::class, 'store'])->name('store');
    Route::get('/{id}', [{$controllerName}::class, 'show'])->name('show');
    Route::get('/{id}/edit', [{$controllerName}::class, 'edit'])->name('edit');
    Route::put('/{id}', [{$controllerName}::class, 'update'])->name('update');
    Route::delete('/{id}', [{$controllerName}::class, 'destroy'])->name('destroy');
});

PHP;

        file_put_contents($routesPath, $content);
        $this->info('Created: routes/web.php');
    }

    /**
     * Create Views (Blade).
     */
    protected function createViews(string $modulePath, string $slug): void
    {
        $viewsPath = "{$modulePath}/resources/views";

        $indexView = <<<BLADE
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$slug} - Listagem</title>
</head>
<body>
    <h1>Listagem de {$slug}</h1>
    <p>Módulo {$slug} funcionando corretamente!</p>
</body>
</html>

BLADE;

        file_put_contents("{$viewsPath}/index.blade.php", $indexView);
        $this->info('Created: resources/views/index.blade.php');
    }

    /**
     * Create Factory.
     */
    protected function createFactory(string $moduleName, string $modulePath, string $namespace): void
    {
        $modelName = Str::singular($moduleName);
        $factoryName = "{$modelName}Factory";
        $factoryPath = "{$modulePath}/database/factories/{$factoryName}.php";

        $content = <<<PHP
<?php

namespace {$namespace}\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\\{$moduleName}\Models\\{$modelName};

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\\{$namespace}\Models\\{$modelName}>
 */
class {$factoryName} extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected \$model = {$modelName}::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            //
        ];
    }
}

PHP;

        file_put_contents($factoryPath, $content);
        $this->info("Created: {$factoryName}.php");
    }

    /**
     * Create Seeder.
     */
    protected function createSeeder(string $moduleName, string $modulePath, string $namespace): void
    {
        $modelName = Str::singular($moduleName);
        $seederName = "{$modelName}Seeder";
        $seederPath = "{$modulePath}/database/seeders/{$seederName}.php";

        $content = <<<PHP
<?php

namespace {$namespace}\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\\{$moduleName}\Models\\{$modelName};

class {$seederName} extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // {$modelName}::factory(10)->create();
    }
}

PHP;

        file_put_contents($seederPath, $content);
        $this->info("Created: {$seederName}.php");
    }

    /**
     * Create Tests.
     */
    protected function createTests(string $moduleName, string $modulePath, string $namespace, string $slug): void
    {
        $modelName = Str::singular($moduleName);
        $controllerName = "{$modelName}Controller";
        $testName = "{$modelName}Test";

        // Feature Test
        $featureTestPath = "{$modulePath}/tests/Feature/{$testName}.php";
        $featureTestContent = <<<PHP
<?php

namespace {$namespace}\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class {$testName} extends TestCase
{
    use RefreshDatabase;

    public function test_index_page_can_be_rendered(): void
    {
        \$response = \$this->get(route('{$slug}.index'));

        \$response->assertStatus(200);
    }

    public function test_create_page_can_be_rendered(): void
    {
        \$response = \$this->get(route('{$slug}.create'));

        \$response->assertStatus(200);
    }
}

PHP;

        // Unit Test
        $unitTestPath = "{$modulePath}/tests/Unit/{$testName}.php";
        $unitTestContent = <<<PHP
<?php

namespace {$namespace}\Tests\Unit;

use Modules\\{$moduleName}\Models\\{$modelName};
use Tests\TestCase;

class {$testName} extends TestCase
{
    public function test_model_can_be_instantiated(): void
    {
        \$model = new {$modelName}();

        \$this->assertInstanceOf({$modelName}::class, \$model);
    }
}

PHP;

        file_put_contents($featureTestPath, $featureTestContent);
        file_put_contents($unitTestPath, $unitTestContent);

        $this->info("Created: tests/Feature/{$testName}.php");
        $this->info("Created: tests/Unit/{$testName}.php");
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

        // Verificar se já está registrado
        if (str_contains($content, $providerClass)) {
            $this->warn('Provider already registered in bootstrap/providers.php');

            return;
        }

        // Adicionar o provider
        $content = str_replace(
            '];',
            "    {$providerClass}::class,\n];",
            $content
        );

        file_put_contents($providersPath, $content);
        $this->info('Registered provider in bootstrap/providers.php');
    }
}
