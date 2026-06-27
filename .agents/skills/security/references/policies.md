# Policies & Permissions (fisioweb)

Templates espelhando código real: `modules/Clinic/app/Policies/ClinicUserPolicy.php`, `modules/Clinic/app/Http/Controllers/ClinicUserController.php`, `resources/js/application/clinic/permissions.ts`, `resources/js/components/clinic/RequireClinicAdmin.tsx`.

## Backend — Policy básica

```php
<?php

namespace Modules\Clinic\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\Patient;

class PatientPolicy
{
    public function viewAny(ClinicUser $user): bool
    {
        return true; // qualquer usuário da clínica vê a lista (já filtrada por clinic_id)
    }

    public function view(ClinicUser $user, Patient $patient): bool
    {
        return $user->clinic_id === $patient->clinic_id;
    }

    public function create(ClinicUser $user): bool
    {
        return in_array($user->role, ['admin', 'physiotherapist', 'secretary'], true);
    }

    public function update(ClinicUser $user, Patient $patient): bool
    {
        if ($user->clinic_id !== $patient->clinic_id) {
            return false;
        }
        return in_array($user->role, ['admin', 'physiotherapist'], true);
    }

    public function delete(ClinicUser $user, Patient $patient): bool
    {
        return $user->clinic_id === $patient->clinic_id && $user->role === 'admin';
    }

    // Ação custom além do CRUD
    public function archive(ClinicUser $user, Patient $patient): bool
    {
        return $user->clinic_id === $patient->clinic_id
            && in_array($user->role, ['admin', 'secretary'], true);
    }
}
```

**Pontos:**
- Primeiro arg sempre é o **usuário autenticado** (vem do guard).
- Segundo arg é o recurso (não usado em `viewAny`/`create`).
- Ownership por `clinic_id` é o padrão dominante.
- Papel por `in_array(..., [...], true)` (strict).
- `true` = permite, `false` = nega (403).

## Registro — Gate::policy

Em `modules/<Module>/app/Providers/<Module>ServiceProvider.php`, dentro de `boot()`:

```php
use Illuminate\Support\Facades\Gate;
use Modules\Clinic\Models\Patient;
use Modules\Clinic\Policies\PatientPolicy;

public function boot(): void
{
    // ... outros registros
    Gate::policy(Patient::class, PatientPolicy::class);
    Gate::policy(TreatmentPlan::class, TreatmentPlanPolicy::class);
    // etc.
}
```

**Sem registro, `authorize()` lança "no policy found"**. É o erro mais comum.

Alternativa: `AuthServiceProvider::$policies` array — mas no projeto modular o registro fica no provider do módulo.

## Controller — `authorizeResource`

Padrão real (`ClinicUserController`):

```php
public function __construct(
    protected ClinicUserServiceInterface $clinicUserService,
) {
    $this->authorizeResource(ClinicUser::class, 'user');
}
```

Isto **mapeia automaticamente** os métodos do controller para a Policy:

| Método do controller | Chama policy |
|---------------------|--------------|
| `index()` | `viewAny` |
| `show()` | `view` |
| `create()` | `create` |
| `store()` | `create` |
| `edit()` | `update` |
| `update()` | `update` |
| `destroy()` | `delete` |

O segundo arg (`'user'`) é o nome do parâmetro de rota — deve casar com o `Route::resource('users', ...)` ou `Route::get('{user}', ...)`.

### Para métodos customizados (fora do REST padrão)

```php
public function archive(Patient $patient): JsonResponse
{
    $this->authorize('archive', $patient);

    $this->service->archive($patient);
    return response()->json(['message' => 'Paciente arquivado.']);
}
```

`authorize('archive', $patient)` chama `PatientPolicy::archive($currentUser, $patient)`. Falha = 403 automático.

## Route Model Binding — crítico para Policies

`authorizeResource` exige que a rota use **route model binding**:

```php
// ❌ recebendo ID — Policy não recebe model, falha
Route::put('users/{id}', [ClinicUserController::class, 'update']);

// ✅ recebendo model — Policy recebe instância
Route::put('users/{user}', [ClinicUserController::class, 'update']);
```

E no controller:

```php
public function update(UpdateClinicUserRequest $request, ClinicUser $user): JsonResponse
```

Laravel resolve `{user}` para `ClinicUser::findOrFail($id)` automaticamente.

## FormRequest — quando `authorize()` faz sentido

Hoje quase todos os FormRequests do projeto fazem `return true`, deixando autorização pro middleware + Policy. **Isso está correto** — não duplicar.

```php
public function authorize(): bool
{
    return true; // Policy + middleware já cobrem
}
```

Use `authorize()` no FormRequest **só** quando a regra depende do **payload** (não do recurso ou usuário):

```php
public function authorize(): bool
{
    // só admin pode mudar role
    if ($this->input('role') === 'admin') {
        return Auth::guard('clinic')->user()?->role === 'admin';
    }
    return true;
}
```

Cenários assim são raros. Em geral: deixe `true` e proteja via Policy.

## Testando Policy

Padrão real (`modules/Clinic/tests/Unit/Policies/`).

```php
<?php

namespace Modules\Clinic\Tests\Unit\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\Patient;
use Modules\Clinic\Policies\PatientPolicy;
use Tests\TestCase;

class PatientPolicyTest extends TestCase
{
    private PatientPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new PatientPolicy();
    }

    public function test_view_allows_user_from_same_clinic(): void
    {
        $user    = new ClinicUser(['clinic_id' => 1]);
        $patient = new Patient(['clinic_id' => 1]);

        $this->assertTrue($this->policy->view($user, $patient));
    }

    public function test_view_denies_user_from_other_clinic(): void
    {
        $user    = new ClinicUser(['clinic_id' => 1]);
        $patient = new Patient(['clinic_id' => 2]);

        $this->assertFalse($this->policy->view($user, $patient));
    }

    public function test_delete_requires_admin_role(): void
    {
        $admin = new ClinicUser(['clinic_id' => 1, 'role' => 'admin']);
        $secretary = new ClinicUser(['clinic_id' => 1, 'role' => 'secretary']);
        $patient = new Patient(['clinic_id' => 1]);

        $this->assertTrue($this->policy->delete($admin, $patient));
        $this->assertFalse($this->policy->delete($secretary, $patient));
    }
}
```

Testa Policy isolada via `new`. Sem DB, sem Auth, sem RefreshDatabase — rápido. Use Feature test (com `actingAs($user, 'clinic')`) para cobrir o fluxo controller → policy → 403.

## Frontend — `permissions.ts`

Padrão real (`application/clinic/permissions.ts`):

```ts
import type { ClinicRole } from '@/domain/auth/session';

export const can = {
    delete:                 (role?: ClinicRole) => role === 'admin',
    deleteOwn:              (role?: ClinicRole) => role === 'admin' || role === 'physiotherapist',
    manageUsers:            (role?: ClinicRole) => role === 'admin',
    sign:                   (role?: ClinicRole) => role === 'admin' || role === 'physiotherapist',
    bulkInactivate:         (role?: ClinicRole) => role === 'admin' || role === 'secretary',
    manageClinicalRecords:  (role?: ClinicRole) => role === 'admin' || role === 'physiotherapist',
};
```

**Convenções:**
- Aceita `role?: ClinicRole | undefined` — papel pode estar carregando.
- Retorna `boolean`.
- Nomeie por **ação**, não por papel: `can.manageUsers`, não `can.admin`.
- Cada chave espelha uma decisão de UI/UX que reflete uma Policy do backend.

`ClinicRole` em `domain/auth/session.ts`:

```ts
export type ClinicRole = 'admin' | 'physiotherapist' | 'secretary';
```

## Frontend — esconder ação

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { can } from '@/application/clinic/permissions';

function PatientRow({ patient }: { patient: Patient }) {
    const { user } = useAuth();
    const role = user?.role as ClinicRole | undefined;

    return (
        <TableRow>
            <TableCell>{patient.name}</TableCell>
            <TableCell>
                {can.manageClinicalRecords(role) && (
                    <Button onClick={() => editClinical(patient.id)}>Editar prontuário</Button>
                )}
                {can.delete(role) && (
                    <Button variant="ghost" onClick={() => onDelete(patient.id)}>
                        <Trash2 />
                    </Button>
                )}
            </TableCell>
        </TableRow>
    );
}
```

**Lembre:** se o backend permite e o frontend esconde, é "wishful UX". Se o frontend mostra e o backend nega, é bug. Mantenha alinhado.

## Frontend — `RequireXxx` para rota inteira

Real (`components/clinic/RequireClinicAdmin.tsx`):

```tsx
import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { can } from '@/application/clinic/permissions';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';

export function RequireClinicAdmin({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth();
    const location = useLocation();
    const role = user?.role as ClinicRole | undefined;

    if (isLoading) return null;

    if (!can.manageUsers(role)) {
        return <Navigate to="/clinica" replace state={{ from: location.pathname }} />;
    }

    return children;
}
```

Uso no router:

```tsx
{
    path: 'usuarios',
    element: (
        <RequireClinicAdmin>
            <UserListPage />
        </RequireClinicAdmin>
    ),
}
```

### Padrão "self ou admin"

Real (`RequireClinicUserSelfOrAdmin`):

```tsx
export function RequireClinicUserSelfOrAdmin({
    children,
    userId,
}: {
    children: ReactNode;
    userId?: string;
}) {
    const { user, isLoading } = useAuth();
    const location = useLocation();
    const role = user?.role as ClinicRole | undefined;

    if (isLoading) return null;

    if (!user) {
        return <Navigate to="/clinica/login" replace state={{ from: location.pathname }} />;
    }

    // se não passou userId, manda para a própria edição
    if (!userId) {
        return <Navigate to={`/clinica/usuarios/${user.id}/editar`} replace />;
    }

    // se não é admin e o id não bate, manda para a própria
    if (!can.manageUsers(role) && String(user.id) !== userId) {
        return <Navigate to={`/clinica/usuarios/${user.id}/editar`} replace />;
    }

    return children;
}
```

Cobre 3 casos:
1. Sem login → login.
2. Sem id → vai pra própria edição.
3. Não-admin tentando editar outro → vai pra própria edição (sem mostrar erro 403).

Uso:

```tsx
{
    path: 'usuarios/:id/editar',
    element: (
        <RequireClinicUserSelfOrAdmin userId={params.id}>
            <UserEditPage />
        </RequireClinicUserSelfOrAdmin>
    ),
}
```

(O `params.id` na verdade vem dentro do componente via `useParams` — adapte na hora de plugar.)

## Testando frontend — `permissions.test.ts`

Padrão real:

```ts
import { describe, expect, it } from 'vitest';
import { can } from '@/application/clinic/permissions';

describe('can.manageUsers', () => {
    it('admin pode gerenciar usuários', () => {
        expect(can.manageUsers('admin')).toBe(true);
    });

    it('fisioterapeuta não pode gerenciar usuários', () => {
        expect(can.manageUsers('physiotherapist')).toBe(false);
    });

    it('secretária não pode gerenciar usuários', () => {
        expect(can.manageUsers('secretary')).toBe(false);
    });

    it('sem role retorna false', () => {
        expect(can.manageUsers(undefined)).toBe(false);
    });
});
```

Função pura, teste de 1 linha.

Para testar `RequireClinicAdmin`, monte um wrapper com `AuthContext.Provider` falso e verifique redirect com `MemoryRouter`. Ver [`frontend-testing`](../../frontend-testing/SKILL.md).

## Common pitfalls

### 1. Policy não registrada → "No policy found"

Esquecer `Gate::policy(Patient::class, PatientPolicy::class)` no provider. Erro 500 ao chamar endpoint protegido.

### 2. Route model binding com ID em vez de model

```php
// ❌
Route::get('patients/{id}', [PatientController::class, 'show']);

public function __construct() {
    $this->authorizeResource(Patient::class, 'patient'); // 'patient' não é 'id'
}
```

Use `{patient}` e tipo `Patient $patient` no método.

### 3. FormRequest com lógica duplicada da Policy

```php
// ❌
public function authorize(): bool
{
    return $this->user()?->role === 'admin';
}
```

Já tem Policy que valida isso. Use `return true` e deixe Policy decidir.

### 4. Frontend esconde, backend não protege

```tsx
{can.delete(role) && <DeleteButton />}
```

Sem Policy `delete` no backend, qualquer um chama o endpoint via curl. Sempre **dois lados**.

### 5. Usar `auth()->user()` em vez de `Auth::guard('clinic')->user()`

`auth()` retorna o guard "default". Em rotas `clinic/*` com JWT custom, isso pode ser `null` ou o guard errado. Use **sempre** `Auth::guard('clinic')->user()` ou `Auth::guard('admin')->user()` explícito.

### 6. Esconder no frontend e deixar o usuário descobrir 403

Se a UI consegue navegar até uma página e só lá descobre que não pode, é UX ruim. **Pré-valide com `RequireXxx` no roteamento**.

## Checklist — endpoint protegido

- [ ] Rota dentro de `Route::middleware('auth:admin'|'auth:clinic')->group(...)`.
- [ ] Controller usa `$this->authorizeResource(Model::class, 'param')` ou `$this->authorize('action', $model)`.
- [ ] Route Model Binding (`Patient $patient`, não `int $id`).
- [ ] Policy criada em `modules/<Module>/app/Policies/`.
- [ ] Policy registrada em `<Module>ServiceProvider::boot()` com `Gate::policy(...)`.
- [ ] Policy tem teste em `modules/<Module>/tests/Unit/Policies/`.
- [ ] Feature test com `actingAs($wrongUser, 'clinic')` confirma 403.
- [ ] Helper `can.xxx` em `application/<contexto>/permissions.ts` espelha a Policy.
- [ ] UI esconde ação com `{can.xxx(role) && ...}`.
- [ ] Se a rota inteira é restrita: `<RequireXxx>` no roteamento.
- [ ] Helper `can.xxx` tem teste em `resources/js/test/permissions.test.ts`.
