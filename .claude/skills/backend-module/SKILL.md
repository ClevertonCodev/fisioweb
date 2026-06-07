---
name: backend-module
description: Criar um novo recurso CRUD no backend Laravel modular do fisioweb (Controller → FormRequest → Service → Repository → Contracts → Routes). Use sempre que precisar adicionar um endpoint REST novo em qualquer módulo (Admin, Clinic, Patient, Media, etc.), criar um recurso administrável, expor uma entidade Eloquent via API, ou refatorar um controller "gordo" para o padrão Service+Repository do projeto.
---

# Backend Module (Laravel modular fisioweb)

Padrão obrigatório para qualquer recurso novo dentro de `modules/<Module>/`. Espelha o que está em `modules/Admin/` (Exercise, Feature, AdminProgram são as referências).

## Estrutura de pastas

```
modules/<Module>/
├── app/
│   ├── Contracts/
│   │   ├── <Entity>RepositoryInterface.php
│   │   └── <Entity>ServiceInterface.php
│   ├── Repositories/
│   │   └── <Entity>Repository.php          # implements RepositoryInterface
│   ├── Services/
│   │   └── <Entity>Service.php             # implements ServiceInterface
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── <Entity>Controller.php
│   │   └── Requests/
│   │       ├── Store<Entity>Request.php
│   │       └── Update<Entity>Request.php
│   ├── Models/
│   │   └── <Entity>.php
│   └── Providers/
│       └── <Module>ServiceProvider.php     # bind Contract → Implementation
├── database/migrations/
└── routes/
    ├── api.php                              # rotas públicas/auth
    └── <module>.php                         # rotas autenticadas (auth:admin ou auth:clinic)
```

## Camadas — responsabilidade

| Camada | Pode | Não pode |
|--------|------|----------|
| Controller | Receber Request validado, chamar Service, montar JsonResponse, traduzir exceções de domínio em status HTTP | Conter regra de negócio, fazer query Eloquent, instanciar Repository direto |
| FormRequest | Validar input, normalizar dados via `prepareForValidation()` | Decidir autorização (deixa pro Policy/middleware) |
| Service | Regra de negócio, orquestrar Repositories, transações, setar `created_by` via `Auth::guard(...)`| Construir queries Eloquent, retornar JsonResponse |
| Repository | Queries Eloquent, eager loading, filtros de listagem, paginação | Regra de negócio, validação |
| Contract | Definir assinatura pública de Service/Repository | Conter código |
| Model | Relacionamentos, casts, scopes (`active()`), constantes (`ALLOWED_KEYS`, `TYPES`) | Lógica de fluxo |

## Assinaturas padrão (siga literalmente)

### `<Entity>RepositoryInterface`

```php
<?php

namespace Modules\<Module>\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\<Module>\Models\<Entity>;

interface <Entity>RepositoryInterface
{
    public function find(int $id): ?<Entity>;
    public function findOrFail(int $id): <Entity>;
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;
    public function create(array $data): <Entity>;
    public function update(int $id, array $data): <Entity>;
    public function delete(int $id): bool;
}
```

### `<Entity>ServiceInterface`

```php
<?php

namespace Modules\<Module>\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\<Module>\Models\<Entity>;

interface <Entity>ServiceInterface
{
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator;
    public function find(int $id): <Entity>;
    public function create(array $data): <Entity>;
    public function update(int $id, array $data): <Entity>;
    public function delete(int $id): bool;
}
```

### Repository

```php
<?php

namespace Modules\<Module>\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\<Module>\Contracts\<Entity>RepositoryInterface;
use Modules\<Module>\Models\<Entity>;

class <Entity>Repository implements <Entity>RepositoryInterface
{
    public function __construct(protected <Entity> $model) {}

    public function find(int $id): ?<Entity>
    {
        return $this->model->find($id);
    }

    public function findOrFail(int $id): <Entity>
    {
        return $this->model->findOrFail($id);
    }

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->with([/* relations */]);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        // demais filtros via !empty($filters['x']) ou array_key_exists para booleanos

        return $query->latest()->paginate($perPage)->withQueryString();
    }

    public function create(array $data): <Entity>
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): <Entity>
    {
        $row = $this->findOrFail($id);
        $row->update($data);
        return $row->fresh();
    }

    public function delete(int $id): bool
    {
        return (bool) $this->findOrFail($id)->delete();
    }
}
```

### Service

```php
<?php

namespace Modules\<Module>\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Modules\<Module>\Contracts\<Entity>RepositoryInterface;
use Modules\<Module>\Contracts\<Entity>ServiceInterface;
use Modules\<Module>\Models\<Entity>;

class <Entity>Service implements <Entity>ServiceInterface
{
    public function __construct(protected <Entity>RepositoryInterface $repository) {}

    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->paginate($filters, $perPage);
    }

    public function find(int $id): <Entity>
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): <Entity>
    {
        $data['created_by'] = Auth::guard('admin')->id(); // ou 'clinic'
        return $this->repository->create($data);
    }

    public function update(int $id, array $data): <Entity>
    {
        return $this->repository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }
}
```

Use `DB::transaction(function () use ($data) { ... })` quando criar/atualizar envolver múltiplas tabelas — veja `AdminProgramService::create`.

### Controller

```php
<?php

namespace Modules\<Module>\Http\Controllers;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\<Module>\Contracts\<Entity>ServiceInterface;
use Modules\<Module>\Http\Requests\Store<Entity>Request;
use Modules\<Module>\Http\Requests\Update<Entity>Request;

class <Entity>Controller extends Controller
{
    public function __construct(protected <Entity>ServiceInterface $service) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', /* outros filtros */]);
        $perPage = $request->integer('per_page', 15);

        return response()->json(['data' => $this->service->list($filters, $perPage)]);
    }

    public function show(int $id): JsonResponse
    {
        try {
            return response()->json(['data' => $this->service->find($id)]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Recurso não encontrado.'], 404);
        }
    }

    public function store(Store<Entity>Request $request): JsonResponse
    {
        $entity = $this->service->create($request->validated());
        return response()->json(['data' => $entity], 201);
    }

    public function update(Update<Entity>Request $request, int $id): JsonResponse
    {
        try {
            $entity = $this->service->update($id, $request->validated());
            return response()->json(['data' => $entity]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Recurso não encontrado.'], 404);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->delete($id);
            return response()->json(['message' => 'Recurso removido com sucesso.']);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Recurso não encontrado.'], 404);
        }
    }
}
```

### FormRequest

```php
<?php

namespace Modules\<Module>\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class Store<Entity>Request extends FormRequest
{
    public function authorize(): bool
    {
        return true; // autorização vem do middleware auth:<guard> + Policy
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            // use Rule::in($model::TYPES), Rule::unique('table','col'), etc.
        ];
    }
}
```

Para Update, ajustar `unique` com `Rule::unique('t','c')->ignore($this->route('id'))`.

### Rotas

Adicione **dentro** do grupo `auth:<guard>` em `modules/<Module>/routes/<module>.php`:

```php
Route::prefix('<entities>')->name('<module>.<entities>.')->group(function () {
    Route::get('/',         [<Entity>Controller::class, 'index'])->name('index');
    Route::get('{id}',      [<Entity>Controller::class, 'show'])->name('show');
    Route::post('/',        [<Entity>Controller::class, 'store'])->name('store');
    Route::put('{id}',      [<Entity>Controller::class, 'update'])->name('update');
    Route::delete('{id}',   [<Entity>Controller::class, 'destroy'])->name('destroy');
});
```

Guard correto por módulo:
- `modules/Admin/routes/admin.php` → `middleware('auth:admin')`
- `modules/Clinic/routes/clinic.php` → `middleware('auth:clinic')`

### ServiceProvider — registrar binding

Em `modules/<Module>/app/Providers/<Module>ServiceProvider.php`, dentro de `register()`:

```php
$this->app->bind(<Entity>RepositoryInterface::class, <Entity>Repository::class);
$this->app->bind(<Entity>ServiceInterface::class, <Entity>Service::class);
```

**Sem isso o controller não resolve.** É o passo mais esquecido.

## Convenções obrigatórias

- **PHP 8.2+**. Não adicionar `declare(strict_types=1)` (projeto não usa hoje — manter consistência).
- Promover propriedades no construtor (`public function __construct(protected XService $x) {}`).
- Mensagens de erro/sucesso ao usuário em **português**.
- Sempre retornar `JsonResponse`, sempre embrulhar payload em `['data' => ...]` para listagens/show/store/update e `['message' => '...']` para destroy/erro.
- Status 201 em `store`. 404 com mensagem PT quando `ModelNotFoundException`.
- Paginação: `paginate($perPage)->withQueryString()`.
- Eager loading: `with([...])` no Repository, nunca N+1 no Controller.
- Filtros: `!empty($filters['x'])` para strings, `array_key_exists('x', $filters)` para booleanos.
- `Auth::guard('admin')` ou `Auth::guard('clinic')` — nunca `Auth::user()` sem guard.

## Antipadrões proibidos

- Controller chamando `Model::query()` direto (vai pro Repository).
- Controller injetando Repository (deve injetar Service via Interface).
- Service instanciando Repository com `new` (resolve via Interface no construtor).
- Esquecer de registrar binding no ServiceProvider.
- Regra de negócio em FormRequest (validação ≠ regra).
- `try/catch` engolindo exceção sem traduzir pra resposta HTTP.
- Resposta sem `data`/`message` wrapper.
- Rota fora do grupo `auth:<guard>` quando o endpoint exige autenticação.

## Checklist antes de marcar como pronto

1. Contract Repository + Service criados.
2. Implementações Repository + Service criadas.
3. Controller injeta `ServiceInterface`, não a classe concreta.
4. Store/Update FormRequests com `rules()` cobrindo todos os campos.
5. Migration criada (e rodada localmente).
6. Model com `$fillable`, `$casts`, relacionamentos.
7. Bindings adicionados no `<Module>ServiceProvider::register()`.
8. Rotas adicionadas no arquivo certo (`admin.php`/`clinic.php`) dentro do grupo `auth:<guard>`.
9. `composer run test` passa.
10. Resposta JSON segue o wrapper `data`/`message`.
