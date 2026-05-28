# Plano: Sistema de Permissões por Role (ClinicUser)

## Context

O módulo Clinic tem 3 roles (`admin`, `physiotherapist`, `secretary`) mas **nenhuma verificação de permissão existe** — todos os usuários autenticados podem fazer tudo. O objetivo é implementar controle de acesso baseado em roles, protegendo ações destrutivas (delete), administrativas (gestão de usuários) e clínicas (evoluções/avaliações).

---

## Matriz de Permissões Final

| Recurso / Ação | admin | secretary | physiotherapist |
|---|:---:|:---:|:---:|
| **Dashboard** ver | ✅ | ✅ | ✅ |
| **Pacientes** listar, ver, criar, editar, foto | ✅ | ✅ | ✅ |
| **Pacientes** deletar | ✅ | ❌ | ❌ |
| **Pacientes** inativar em massa | ✅ | ✅ | ❌ |
| **Planos de Tratamento** listar, ver, criar, editar, duplicar, PDF | ✅ | ✅ | ✅ |
| **Planos de Tratamento** deletar | ✅ | ❌ | ❌ |
| **Avaliações** listar, ver | ✅ | ✅ | ✅ |
| **Avaliações** criar, editar | ✅ | ❌ | ✅ (próprias) |
| **Avaliações** assinar | ✅ | ❌ | ✅ (próprias) |
| **Avaliações** deletar | ✅ | ❌ | ❌ |
| **Evoluções** listar, ver, PDF | ✅ | ✅ | ✅ |
| **Evoluções** criar, editar, gerar texto | ✅ | ❌ | ✅ (próprias) |
| **Evoluções** assinar | ✅ | ❌ | ✅ (próprias) |
| **Evoluções** deletar | ✅ | ❌ | ❌ |
| **Templates (evolução/questionário)** listar, ver, criar, editar | ✅ | ✅ | ✅ |
| **Templates** deletar | ✅ | ❌ | ❌ |
| **Questionários do paciente** enviar, listar, ver | ✅ | ✅ | ✅ |
| **Questionários do paciente** deletar | ✅ | ❌ | ✅ (próprios, do seu paciente) |
| **Arquivos do paciente** listar, criar | ✅ | ✅ | ✅ |
| **Arquivos do paciente** deletar | ✅ | ❌ | ✅ (próprios) |
| **Exercícios** listar, favoritar | ✅ | ✅ | ✅ |
| **Programas/Templates compartilhados** ver | ✅ | ✅ | ✅ |
| **Usuários da clínica** listar | ✅ | ✅ | ✅ |
| **Usuários da clínica** criar, editar | ✅ | ✅ | ❌ |
| **Usuários da clínica** deletar | ✅ (todos) | ✅ (exceto admins) | ❌ |

### Resumo por role
- **Admin**: acesso total, único que deleta tudo e gerencia permissões
- **Secretary**: gestão administrativa (pacientes, templates, usuários), mas NÃO cria/edita evoluções/avaliações (documentos clínicos), NÃO assina, NÃO deleta registros gerais. Pode deletar usuários não-admin.
- **Physiotherapist**: trabalho clínico completo (evoluções, avaliações, questionários) mas apenas nos **próprios** registros, NÃO gerencia usuários, NÃO deleta registros gerais

### Ownership ("próprios")
Verificação via `clinic_user_id` nos models:
- `PatientEvolution.clinic_user_id` — quem criou a evolução
- `Assessment.clinic_user_id` — quem criou a avaliação
- `PatientQuestionnaire.clinic_user_id` — quem enviou o questionário
- `PatientFile` — preciso verificar se tem `clinic_user_id` (se não tiver, adicionar via migration)

---

## Implementação Backend

### Fase 1: Model + Middleware

#### 1.1 Helper methods no ClinicUser
**Arquivo:** `modules/Clinic/app/Models/ClinicUser.php`

```php
public function isAdmin(): bool { return $this->role === self::ROLE_ADMIN; }
public function isSecretary(): bool { return $this->role === self::ROLE_SECRETARY; }
public function isPhysiotherapist(): bool { return $this->role === self::ROLE_PHYSIOTHERAPIST; }
public function canDelete(): bool { return $this->isAdmin(); }
public function canSign(): bool { return in_array($this->role, [self::ROLE_ADMIN, self::ROLE_PHYSIOTHERAPIST]); }
public function canManageUsers(): bool { return in_array($this->role, [self::ROLE_ADMIN, self::ROLE_SECRETARY]); }
public function canBulkInactivate(): bool { return in_array($this->role, [self::ROLE_ADMIN, self::ROLE_SECRETARY]); }
public function canManageClinicalRecords(): bool { return in_array($this->role, [self::ROLE_ADMIN, self::ROLE_PHYSIOTHERAPIST]); }
public function ownsRecord(Model $record): bool { return $record->clinic_user_id === $this->id; }
```

#### 1.2 Middleware CheckRole
**Criar:** `modules/Clinic/app/Http/Middleware/CheckRole.php`
- Recebe roles como parâmetros: `role:admin,secretary`
- Verifica `Auth::guard('clinic')->user()->role`
- Retorna 403 JSON se não autorizado

**Registrar:** `bootstrap/app.php` → alias `'role'`

### Fase 2: Permission checks nos controllers existentes

Padrão de check inline (consistente com padrão existente de `clinic_id`):

**Controllers e métodos a modificar:**

| Controller | Método | Check |
|---|---|---|
| `PatientController` | `destroy()` | `canDelete()` |
| `PatientController` | `bulkInactivate()` | `canBulkInactivate()` |
| `TreatmentPlanController` | `destroy()` | `canDelete()` |
| `AssessmentController` | `storeForPatient()` | `canManageClinicalRecords()` |
| `AssessmentController` | `update()` | `canManageClinicalRecords()` + ownership se physio |
| `AssessmentController` | `sign()` | `canSign()` + ownership se physio |
| `AssessmentController` | `destroy()` | `canDelete()` |
| `EvolutionController` | `storeForPatient()` | `canManageClinicalRecords()` |
| `EvolutionController` | `update()` | `canManageClinicalRecords()` + ownership se physio |
| `EvolutionController` | `generateText()` | `canManageClinicalRecords()` + ownership se physio |
| `EvolutionController` | `sign()` | `canSign()` + ownership se physio |
| `EvolutionController` | `destroy()` | `canDelete()` |
| `EvolutionTemplateController` | `destroy()` | `canDelete()` |
| `QuestionnaireTemplateController` | `destroy()` | `canDelete()` |
| `PatientQuestionnaireController` | `destroy()` | `canDelete()` OU ownership se physio |
| `PatientFileController` | `destroy()` | `canDelete()` OU ownership se physio |

**Padrão ownership para physiotherapist:**
```php
$user = Auth::guard('clinic')->user();
if (!$user->canDelete() && !$user->ownsRecord($record)) {
    return response()->json(['message' => 'Ação não permitida.'], 403);
}
```

### Fase 3: CRUD completo de ClinicUser

**Criar:**
- `modules/Clinic/app/Http/Requests/StoreClinicUserRequest.php` — authorize via `canManageUsers()`
- `modules/Clinic/app/Http/Requests/UpdateClinicUserRequest.php` — authorize via `canManageUsers()`
- `modules/Clinic/app/Services/ClinicUserService.php`
- `modules/Clinic/app/Contracts/ClinicUserServiceInterface.php`

**Modificar:**
- `modules/Clinic/app/Http/Controllers/ClinicUserController.php` — adicionar `show()`, `store()`, `update()`, `destroy()`
- `modules/Clinic/routes/clinic.php` — novas rotas:

```
GET    /clinic/users              → index (todos)
POST   /clinic/users              → store (middleware role:admin,secretary)
GET    /clinic/users/{id}         → show  (middleware role:admin,secretary)
PUT    /clinic/users/{id}         → update (middleware role:admin,secretary)
DELETE /clinic/users/{id}         → destroy (middleware role:admin,secretary) + check: secretary não deleta admin
```

**Proteções:**
- Não pode deletar a si mesmo
- Não pode rebaixar/remover o último admin da clínica
- Secretary NÃO pode deletar usuários admin (só pode deletar physiotherapist e outros secretaries)
- Password hasheado automaticamente (cast no model)

### ~~Fase 4: PatientFile ownership~~ (Não necessário)
`PatientFile` já tem `clinic_user_id` + relationship `clinicUser()` — pronto para ownership check.

---

## Implementação Frontend

### Fase 5: Auth + Permissions

#### 5.1 Atualizar domain User
**Arquivo:** `resources/js/domain/auth/session.ts`
```typescript
export type ClinicRole = 'admin' | 'secretary' | 'physiotherapist';

export interface User {
    id: string | number;
    name: string;
    email: string;
    role?: ClinicRole;
}
```

#### 5.2 Atualizar AuthContext
**Arquivo:** `resources/js/contexts/AuthContext.tsx`
- `normalizeUser()` deve preservar `role` do response da API

#### 5.3 Criar helpers de permissão
**Criar:** `resources/js/application/clinic/permissions.ts`
```typescript
export const can = {
    delete: (role) => role === 'admin',
    deleteOwn: (role) => ['admin', 'physiotherapist'].includes(role),
    manageUsers: (role) => ['admin', 'secretary'].includes(role),
    sign: (role) => ['admin', 'physiotherapist'].includes(role),
    bulkInactivate: (role) => ['admin', 'secretary'].includes(role),
    manageClinicalRecords: (role) => ['admin', 'physiotherapist'].includes(role),
};
```

### Fase 6: Condicionar UI por role

**Páginas a modificar:**
- Todas as listagens com botão delete → esconder se `!can.delete(role)` (ou `!can.deleteOwn(role)` para questionários/arquivos do physio)
- `PatientListPage` → esconder bulk inactivate se `!can.bulkInactivate(role)`
- Assessment/Evolution pages → esconder criar/editar se `!can.manageClinicalRecords(role)`, esconder assinar se `!can.sign(role)`
- `ClinicSidebar.tsx` → adicionar item "Usuários" visível se `can.manageUsers(role)`

### Fase 7: Páginas de gestão de usuários (CRUD)

**Criar:**
- `resources/js/pages/clinic/user/UserListPage.tsx`
- `resources/js/pages/clinic/user/UserNewPage.tsx`
- `resources/js/pages/clinic/user/UserEditPage.tsx`
- `resources/js/application/clinic/use-clinic-users.ts` — hooks React Query
- Adicionar `ClinicUserWriteDto` em `resources/js/application/clinic/ports.ts`
- `resources/js/infrastructure/repositories/api-clinic-users.ts` — repository + mappers
- `resources/js/domain/clinic/clinic-user.ts` — entidade domain (camelCase, sem timestamps)

**Modificar:**
- `resources/js/App.tsx` — rotas `/clinic/users`, `/clinic/users/new`, `/clinic/users/:id/edit`
- `resources/js/components/clinic/ClinicSidebar.tsx` — item "Usuários"

---

## Ordem de Execução

1. Backend: ClinicUser model helpers + CheckRole middleware + bootstrap/app.php
2. Backend: Permission checks nos 8 controllers (destroy, sign, create/edit clinical)
3. Backend: Verificar/adicionar `clinic_user_id` em PatientFile
4. Backend: ClinicUser CRUD completo (service, requests, controller, rotas)
5. Frontend: Domain User + AuthContext + permissions helper
6. Frontend: UI condicionada por role nas páginas existentes
7. Frontend: Páginas CRUD de Usuários

## Verificação

- Login com cada role → verificar que ações proibidas retornam 403
- `composer run test` — testes existentes continuam passando
- Physiotherapist tenta editar evolução de outro → 403
- Physiotherapist deleta próprio questionário → 200
- Secretary tenta criar evolução → 403
- Admin deleta qualquer registro → 200
- Último admin não pode ser deletado/rebaixado
- `npm run types` + `npm run lint` sem erros
