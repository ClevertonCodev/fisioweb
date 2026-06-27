# Modern PHP 8.2+ Features (fisioweb)

Exemplos adaptados ao domínio do projeto: módulos em `Modules\<Module>\`, guards JWT `admin`/`clinic`, entidades reais (`Exercise`, `Patient`, `Feature`, `AdminProgram`).

> **Nota:** o projeto **não** usa `declare(strict_types=1)` hoje. Os exemplos abaixo mostram o recurso com `strict_types` por completude — ao colar no projeto, remova o `declare` para manter consistência, **a menos que** você esteja criando arquivo novo em módulo novo e tenha alinhado a adoção.
> DTO/Enum/Value Object é interno ao módulo por padrão. Se outro módulo for consumir esse tipo, defina estabilidade e ownership pela skill `architecture-paradigm-modular-monolith`.

## Strict Types & Type Declarations

```php
<?php

declare(strict_types=1);

namespace Modules\Patient\Models;

use Modules\Patient\Enums\PatientStatus;

final readonly class PatientSnapshot
{
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public PatientStatus $status,
        public \DateTimeImmutable $createdAt,
    ) {}
}

// Union types — útil para IDs vindos de rota (sempre string) ou serviço (int)
function normalizePatientId(int|string $id): int
{
    return is_int($id) ? $id : (int) $id;
}

// Intersection types — raro no projeto, mas válido para contracts compostos
interface HasOwner {}
interface HasSchedule {}

function dispatchToSlot(HasOwner&HasSchedule $entity): void {}
```

## Enums with Methods

Substitua arrays de constantes (`Feature::ALLOWED_KEYS`, `Feature::TYPES`) por Enum tipado em entidades novas. Para Models existentes, planejar migration antes.

```php
<?php

namespace Modules\Patient\Enums;

enum PatientStatus: string
{
    case ACTIVE     = 'active';
    case INACTIVE   = 'inactive';
    case DISCHARGED = 'discharged';

    public function label(): string
    {
        return match ($this) {
            self::ACTIVE     => 'Ativo',
            self::INACTIVE   => 'Inativo',
            self::DISCHARGED => 'Alta',
        };
    }

    public function badgeColor(): string
    {
        return match ($this) {
            self::ACTIVE     => 'green',
            self::INACTIVE   => 'gray',
            self::DISCHARGED => 'blue',
        };
    }

    public function canScheduleSession(): bool
    {
        return $this === self::ACTIVE;
    }

    public static function fromString(string $value): self
    {
        return self::from(strtolower($value));
    }
}
```

**Cast no Model:**

```php
protected $casts = [
    'status' => PatientStatus::class,
];
```

**Validação no FormRequest:**

```php
public function rules(): array
{
    return [
        'status' => ['required', Rule::enum(PatientStatus::class)],
    ];
}
```

**Frontend:** ao serializar o Enum vira `'active'`, espelhe a união em `domain/`:

```ts
export type PatientStatus = 'active' | 'inactive' | 'discharged';
```

## Readonly Properties & Classes (DTOs e Value Objects)

### DTO de entrada para Service complexo

Quando o payload tem 5+ campos ou requer parsing, troque `array $data` por DTO:

```php
<?php

namespace Modules\Admin\Data;

final readonly class CreateExerciseData
{
    public function __construct(
        public string $name,
        public int $physioAreaId,
        public ?int $physioSubareaId,
        public ?int $bodyRegionId,
        public ?int $videoId,
        public int $createdBy,
    ) {}

    public static function fromValidated(array $data, int $userId): self
    {
        return new self(
            name:            $data['name'],
            physioAreaId:    (int) $data['physio_area_id'],
            physioSubareaId: isset($data['physio_subarea_id']) ? (int) $data['physio_subarea_id'] : null,
            bodyRegionId:    isset($data['body_region_id']) ? (int) $data['body_region_id'] : null,
            videoId:         isset($data['video_id']) ? (int) $data['video_id'] : null,
            createdBy:       $userId,
        );
    }
}
```

Controller continua passando `$request->validated()`:

```php
public function store(StoreExerciseRequest $request): JsonResponse
{
    $dto = CreateExerciseData::fromValidated(
        $request->validated(),
        Auth::guard('admin')->id(),
    );
    $exercise = $this->service->create($dto);
    return response()->json(['data' => $exercise], 201);
}
```

Service ganha contrato tipado: `public function create(CreateExerciseData $dto): Exercise`.

### Value Object para conceito de domínio

```php
<?php

namespace Modules\Admin\ValueObjects;

final readonly class SessionDuration
{
    public function __construct(public int $seconds)
    {
        if ($seconds < 0) {
            throw new \InvalidArgumentException('Duração não pode ser negativa');
        }
        if ($seconds > 14_400) {
            throw new \InvalidArgumentException('Duração não pode exceder 4 horas');
        }
    }

    public function add(self $other): self
    {
        return new self($this->seconds + $other->seconds);
    }

    public function toMinutes(): int
    {
        return (int) floor($this->seconds / 60);
    }

    public function format(): string
    {
        $minutes = $this->toMinutes();
        $seconds = $this->seconds % 60;
        return sprintf('%02d:%02d', $minutes, $seconds);
    }
}
```

### Readonly individual em classe não-readonly

Quando a maioria das props é imutável mas uma é mutável (cache, lazy):

```php
final class ExerciseFilters
{
    public function __construct(
        public readonly ?string $search,
        public readonly ?int $physioAreaId,
        public readonly bool $onlyActive,
        private ?array $compiledCache = null,
    ) {}
}
```

## Attributes (uso comedido no Laravel)

Laravel já resolve roteamento e middleware via DSL própria. **Não** crie Attributes para isso. Atributos custom só fazem sentido para metadata de domínio realmente específica. Exemplo plausível: anotar campos de Model para auditoria automática.

```php
<?php

#[\Attribute(\Attribute::TARGET_PROPERTY | \Attribute::IS_REPEATABLE)]
final readonly class Auditable
{
    public function __construct(
        public string $eventLabel,
        public bool $sensitive = false,
    ) {}
}

class Patient extends Model
{
    #[Auditable(eventLabel: 'patient.email_changed', sensitive: true)]
    public string $email;

    #[Auditable(eventLabel: 'patient.status_changed')]
    public PatientStatus $status;
}
```

Confirme o caso de uso antes de adicionar — atributo sem leitor é só ruído.

## First-Class Callables

Sintaxe `$obj->method(...)` substitui closures triviais em pipelines:

```php
$exerciseIds = [11, 22, 33];

// Antes
$exercises = array_map(fn(int $id) => $this->repository->find($id), $exerciseIds);

// Depois
$exercises = array_map($this->repository->find(...), $exerciseIds);

// Em Collection
$active = collect($exerciseIds)
    ->map($this->repository->find(...))
    ->filter(fn(?Exercise $e) => $e?->is_active)
    ->values();
```

Named arguments combinam bem com callable em util functions:

```php
$result = array_filter(
    array: $exercises,
    callback: fn(Exercise $e) => $e->is_active,
);
```

## Match Expressions

Sempre prefira `match` a `switch` para mapeamentos. Exaustivo: o compilador acusa cases faltando do Enum.

### Match sobre Enum

```php
public function badgeColorFor(PatientStatus $status): string
{
    return match ($status) {
        PatientStatus::ACTIVE     => 'green',
        PatientStatus::INACTIVE   => 'gray',
        PatientStatus::DISCHARGED => 'blue',
    };
}
```

### Match com `true` para faixas/condições compostas

```php
public function calculatePlanPrice(int $patients, string $billing): float
{
    return match (true) {
        $patients <= 10                          => 49.90,
        $patients <= 50  && $billing === 'monthly' => 149.90,
        $patients <= 50                          => 1499.00,
        $patients <= 200 && $billing === 'monthly' => 399.90,
        default                                   => 0.0, // contrato customizado
    };
}
```

### Match com múltiplos cases agrupados

```php
public function categoryFor(int $httpStatus): string
{
    return match ($httpStatus) {
        200, 201, 204     => 'success',
        400, 422          => 'client_error',
        401, 403          => 'unauthorized',
        500, 502, 503     => 'server_error',
        default           => 'unknown',
    };
}
```

## Never Type

Para métodos que **nunca** retornam normalmente (sempre lançam ou encerram):

```php
<?php

namespace Modules\Admin\Exceptions;

final class ExerciseNotFoundException extends \Exception
{
    public static function throw(int $id): never
    {
        throw new self("Exercício {$id} não encontrado.");
    }
}
```

Uso no Service:

```php
public function find(int $id): Exercise
{
    return $this->repository->find($id)
        ?? ExerciseNotFoundException::throw($id);
}
```

Helper típico de redirect/abort em controller standalone (raro em SPA, comum em legado):

```php
function abortJson(int $code, string $message): never
{
    http_response_code($code);
    echo json_encode(['message' => $message]);
    exit;
}
```

> No fisioweb prefira `response()->json([...], $code)` — `abort()` faz sentido só em entrypoint não-controller (artisan command, middleware low-level).

## Fibers — não usar

Fibers só ganham sentido em runtime async (Swoole, ReactPHP, AMPHP). O fisioweb roda em FPM síncrono. **Pular esta feature.**

## Union & DNF Types

Union (`|`) é útil em FormRequest helpers e parsers:

```php
public function readPatientId(mixed $raw): int
{
    return match (true) {
        is_int($raw)                 => $raw,
        is_string($raw) && is_numeric($raw) => (int) $raw,
        default => throw new \InvalidArgumentException('ID inválido'),
    };
}
```

Intersection (`A&B`) e DNF (`(A&B)|C`) são raros no projeto. Não introduza sem necessidade clara.

## Quick Reference

| Feature | PHP | Uso no fisioweb |
|---------|-----|------------------|
| Readonly properties | 8.1+ | `public readonly string $name` em DTO/VO |
| Readonly classes | 8.2+ | `final readonly class CreateExerciseData {}` |
| Enums | 8.1+ | `PatientStatus`, status finitos em entidades novas |
| First-class callables | 8.1+ | `$repo->find(...)` em `array_map`/`collect()->map` |
| Never type | 8.1+ | Helpers `throw`/`exit` em exceptions custom |
| Match expressions | 8.0+ | Mapear Enum → label/color/preço |
| Union types | 8.0+ | `int\|string $id` em normalizadores |
| Pure intersection types | 8.1+ | Raro — só contratos compostos |
| DNF types | 8.2+ | Raro — evitar sem caso de uso |
| Fibers | 8.1+ | **Não usar** (Laravel síncrono) |
| Constants in traits | 8.2+ | Útil em traits de Model (status defaults) |
