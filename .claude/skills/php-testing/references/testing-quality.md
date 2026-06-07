# Testing & Quality (fisioweb)

PHPUnit 11 + Mockery 1.6 em Laravel modular. Todos os exemplos seguem o namespace `Modules\<Module>\Tests\`, snake_case nos nomes de teste, e o envelope `data` do projeto.

> **Sem `declare(strict_types=1)`** nos testes (consistência com o projeto).
> **Sem PHPStan** configurado — tipagem manual via type hints traz ganho via IDE.

## Unit test — Service com Repository mockado

Service depende de `Interface`, então mockamos via `createMock(InterfaceClass)`.

```php
<?php

namespace Modules\Admin\Tests\Unit\Services;

use Modules\Admin\Contracts\ExerciseRepositoryInterface;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Services\ExerciseService;
use PHPUnit\Framework\MockObject\MockObject;
use Tests\TestCase;

class ExerciseServiceTest extends TestCase
{
    private ExerciseRepositoryInterface&MockObject $repository;
    private ExerciseService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = $this->createMock(ExerciseRepositoryInterface::class);
        $this->service    = new ExerciseService($this->repository);
    }

    public function test_find_returns_exercise_from_repository(): void
    {
        $exercise = new Exercise(['id' => 1, 'name' => 'Agachamento']);

        $this->repository
            ->expects($this->once())
            ->method('findOrFail')
            ->with(1)
            ->willReturn($exercise);

        $result = $this->service->find(1);

        $this->assertSame($exercise, $result);
    }

    public function test_create_strips_video_id_and_sets_created_by(): void
    {
        $payload = ['name' => 'Ponte', 'video_id' => 42];
        $created = new Exercise(['id' => 7, 'name' => 'Ponte']);

        $this->repository
            ->expects($this->once())
            ->method('create')
            ->with($this->callback(function (array $data): bool {
                return $data['name'] === 'Ponte'
                    && !array_key_exists('video_id', $data)
                    && array_key_exists('created_by', $data);
            }))
            ->willReturn($created);

        $this->actingAs($this->makeAdminUser(), 'admin');

        $result = $this->service->create($payload);

        $this->assertSame($created, $result);
    }

    private function makeAdminUser(): \Modules\Admin\Models\User
    {
        return \Modules\Admin\Models\User::factory()->create();
    }
}
```

**Pontos importantes:**
- `Interface&MockObject` permite IDE + PHPUnit reconhecerem ambos os tipos.
- `$this->expects($this->once())` falha se o mock não for chamado ou for chamado mais de uma vez.
- `$this->callback(...)` para asserções flexíveis sobre o payload.
- Tudo que toca `Auth::guard('admin')->id()` exige `actingAs($user, 'admin')` antes.

## Feature test — Controller com HTTP + DB

```php
<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\BodyRegion;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\ExerciseFavorite;
use Tests\TestCase;

class ExerciseControllerTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $clinicUser;
    private AdminUser $adminUser;
    private PhysioArea $physioArea;
    private BodyRegion $bodyRegion;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinicUser = ClinicUser::factory()->create();
        $this->adminUser  = AdminUser::factory()->create();
        $this->physioArea = PhysioArea::create(['name' => 'Ortopedia']);
        $this->bodyRegion = BodyRegion::create(['name' => 'Joelho']);
    }

    private function makeExercise(array $overrides = []): Exercise
    {
        return Exercise::create(array_merge([
            'name'           => fake()->words(3, true),
            'physio_area_id' => $this->physioArea->id,
            'body_region_id' => $this->bodyRegion->id,
            'created_by'     => $this->adminUser->id,
            'is_active'      => true,
        ], $overrides));
    }

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/clinic/exercises')->assertUnauthorized();
    }

    public function test_index_returns_paginated_exercises(): void
    {
        $this->makeExercise(['name' => 'Agachamento']);
        $this->makeExercise(['name' => 'Ponte']);

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->getJson('/api/clinic/exercises');

        $response->assertOk();

        $items = $response->json('data.data'); // envelope `data` + paginator `data`
        $this->assertCount(2, $items);
    }

    public function test_show_returns_404_when_exercise_missing(): void
    {
        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->getJson('/api/clinic/exercises/9999');

        $response->assertNotFound()
            ->assertJson(['message' => 'Exercício não encontrado.']);
    }

    public function test_store_validates_required_fields(): void
    {
        $response = $this->actingAs($this->adminUser, 'admin')
            ->postJson('/api/admin/exercises', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'physio_area_id']);
    }

    public function test_store_persists_exercise_and_returns_201(): void
    {
        $response = $this->actingAs($this->adminUser, 'admin')
            ->postJson('/api/admin/exercises', [
                'name'           => 'Prancha',
                'physio_area_id' => $this->physioArea->id,
                'body_region_id' => $this->bodyRegion->id,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Prancha');

        $this->assertDatabaseHas('exercises', [
            'name'       => 'Prancha',
            'created_by' => $this->adminUser->id,
        ]);
    }
}
```

**Pontos importantes:**
- `actingAs($user, 'guard')` — segundo argumento é o guard JWT (`admin` ou `clinic`). Esquecer = teste autentica no guard padrão e falha.
- O controller embrulha em `['data' => ...]`. Quando é paginator, o conteúdo fica em `data.data` (envelope + paginator interno).
- `assertJsonValidationErrors` valida que cada chave esperada está no payload de erro 422.
- `assertDatabaseHas` confirma persistência sem precisar reler via API.
- Use `fake()` (helper global do Faker do Laravel).

## Data Providers (PHPUnit 11)

Use atributos `#[DataProvider]` para parametrizar.

```php
<?php

namespace Modules\Admin\Tests\Unit\Enums;

use Modules\Patient\Enums\PatientStatus;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class PatientStatusTest extends TestCase
{
    #[Test]
    #[DataProvider('labelProvider')]
    public function it_returns_localized_label(PatientStatus $status, string $expected): void
    {
        $this->assertSame($expected, $status->label());
    }

    public static function labelProvider(): array
    {
        return [
            'ativo'    => [PatientStatus::ACTIVE, 'Ativo'],
            'inativo'  => [PatientStatus::INACTIVE, 'Inativo'],
            'alta'     => [PatientStatus::DISCHARGED, 'Alta'],
        ];
    }

    #[Test]
    #[DataProvider('scheduleProvider')]
    public function it_allows_scheduling_only_for_active(PatientStatus $status, bool $expected): void
    {
        $this->assertSame($expected, $status->canScheduleSession());
    }

    public static function scheduleProvider(): array
    {
        return [
            [PatientStatus::ACTIVE, true],
            [PatientStatus::INACTIVE, false],
            [PatientStatus::DISCHARGED, false],
        ];
    }
}
```

Use `PHPUnit\Framework\TestCase` (não `Tests\TestCase`) quando o teste **não** precisa do Laravel bootstrap — mais rápido.

## Mockery (mock avançado, encadeamento)

Quando precisa de matchers mais ricos que `createMock` (sequência condicional, `andReturnUsing`, throw em chamada específica), use Mockery:

```php
<?php

namespace Modules\Admin\Tests\Unit\Services;

use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use Modules\Admin\Contracts\ExerciseRepositoryInterface;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Services\ExerciseService;
use PHPUnit\Framework\TestCase;

class ExerciseServiceMockeryTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    public function test_delete_calls_repository_and_returns_true(): void
    {
        $exercise = Mockery::mock(Exercise::class);
        $exercise->shouldReceive('videos->detach')->once();

        $repository = Mockery::mock(ExerciseRepositoryInterface::class);
        $repository->shouldReceive('findOrFail')->once()->with(7)->andReturn($exercise);
        $repository->shouldReceive('delete')->once()->with(7)->andReturn(true);

        $service = new ExerciseService($repository);

        $this->assertTrue($service->delete(7));
    }

    public function test_create_throws_when_repository_fails(): void
    {
        $repository = Mockery::mock(ExerciseRepositoryInterface::class);
        $repository->shouldReceive('create')
            ->once()
            ->andThrow(new \RuntimeException('DB indisponível'));

        $service = new ExerciseService($repository);

        $this->expectException(\RuntimeException::class);
        $service->create(['name' => 'Falha esperada']);
    }
}
```

**Quando preferir Mockery sobre createMock:**
- Encadeamento de chamada (`videos->detach`).
- `andReturnUsing(fn(...$args) => ...)` para resposta dinâmica.
- Sequência condicional (`->ordered()`).
- Partial mocks (`Mockery::mock(MyClass::class)->makePartial()`).

**Sempre use o trait `MockeryPHPUnitIntegration`** — chama `Mockery::close()` no `tearDown` e converte expectativas não cumpridas em falha.

## Padrão de fixture compartilhada

Crie helpers privados no próprio TestCase para reduzir ruído:

```php
private function authenticatedClinicUser(): ClinicUser
{
    $user = ClinicUser::factory()->create();
    $this->actingAs($user, 'clinic');
    return $user;
}

private function exerciseFor(ClinicUser $user, array $overrides = []): Exercise
{
    return Exercise::factory()->create(array_merge([
        'created_by' => $user->id,
    ], $overrides));
}
```

## Assertions específicas do projeto

| Caso | Assertion |
|------|-----------|
| Resposta JSON OK | `$response->assertOk()` |
| Resposta JSON 201 (store) | `$response->assertCreated()` |
| 422 com campos | `$response->assertUnprocessable()->assertJsonValidationErrors(['x'])` |
| 401 sem autenticação | `$response->assertUnauthorized()` |
| 403 com autenticação mas sem permissão | `$response->assertForbidden()` |
| 404 com mensagem PT | `$response->assertNotFound()->assertJson(['message' => '...'])` |
| Payload em listagem paginada | `$response->json('data.data')` |
| Payload em show/store/update | `$response->json('data')` ou `assertJsonPath('data.x', $val)` |
| Persistência | `$this->assertDatabaseHas('table', [...])` |
| Ausência | `$this->assertDatabaseMissing('table', [...])` |

## Quick Reference

| Item | Como |
|------|------|
| Test file location | `modules/<Module>/tests/{Unit,Feature}/<Name>Test.php` |
| Namespace | `Modules\<Module>\Tests\{Unit,Feature}` |
| Base class | `Tests\TestCase` (sempre, exceto Enum/VO puro → `PHPUnit\Framework\TestCase`) |
| Limpeza DB | `use RefreshDatabase;` |
| Autenticar | `$this->actingAs($user, 'admin'\|'clinic')` |
| Method naming | `test_<estado>_<acao>_<resultado>()` em snake_case |
| Mock simples | `$this->createMock(InterfaceClass::class)` |
| Mock avançado | `Mockery::mock(...)` + trait `MockeryPHPUnitIntegration` |
| Data Provider | `#[DataProvider('methodName')]` + método `public static` |
| Rodar tudo | `composer run test` |
| Rodar filtrado | `./vendor/bin/phpunit --filter test_x` |
| Rodar módulo | `./vendor/bin/phpunit modules/Clinic/tests/` |

## O que **não** vem do template original (Jeffallan) e por quê

- **Pest** — `composer.json` autoriza o plugin mas não há `tests/Pest.php` nem testes em sintaxe Pest. Mantenha PHPUnit puro.
- **PHPStan level 9** — não configurado. Adicionar é decisão arquitetural, não vem com a skill.
- **PSR-12 / CS Fixer** — projeto usa Laravel Pint (`./vendor/bin/pint`). Rodar antes do commit.
- **`declare(strict_types=1)`** — projeto não usa.
- **Coverage HTML/Clover** — `phpunit.xml` não tem bloco `<coverage>`. Se precisar, configurar separadamente sem comitar no `phpunit.xml` principal.
