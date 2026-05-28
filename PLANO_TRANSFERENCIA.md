# Plano de Transferência: fisio → clinic-app

## Contexto

O projeto **fisio** usa Laravel + Inertia.js (SSR) com autenticação via Fortify (sessão). Por problemas com o Inertia no ambiente de desenvolvimento, o projeto foi reescrito como **clinic-app**: um Laravel puro com API REST + JWT e um SPA React separado em `spa/`.

O backend do clinic-app já está bem estruturado com módulos, JWT, rotas e models. O problema principal é que o **frontend SPA usa dados mock** e faltam páginas que já existem no fisio (como CRUD de exercícios no admin). O objetivo deste plano é: corrigir o backend, criar a infraestrutura de API no frontend e portar/adaptar as páginas do fisio para o SPA do clinic-app.

---

## Diagnóstico: O que está faltando

### Backend (`clinic-app`)
| Item | Situação |
|---|---|
| PhysioAreaSeeder | ✅ Existe com dados corretos |
| PhysioSubareaSeeder | ✅ Existe (usa nomes curtos - correto) |
| BodyRegionSeeder | ✅ Existe com dados corretos |
| DatabaseSeeder chama os module seeders | ✅ Corrigido |
| Todas as rotas API | ✅ Existem (admin, clinic, patient, media) |
| Autenticação JWT | ✅ Funcionando |

### Frontend SPA (`clinic-app/spa/src/`)
| Item | Situação |
|---|---|
| Todas as páginas usam dados mock | ❌ Precisam conectar à API real |
| `infrastructure/repositories/` | ❌ Diretório vazio — arquitetura planejada mas não implementada |
| `application/admin/` e `application/clinic/` | ❌ Diretórios vazios |
| Admin: páginas de exercícios (CRUD) | ❌ Não existe nenhuma página de exercícios admin |
| Admin: edit/show de clínicas | ❌ Faltando |
| Admin: edit de funcionalidades e planos | ❌ Faltando |
| Autenticação JWT no SPA (login real) | ❌ LoginPage usa mock |
| Rotas protegidas por role | ❌ Não implementado |
| Portal do paciente | ❌ Não existe |
| Página de configurações | ❌ Não existe |

---

## Plano de Implementação

### Fase 1 — Fix do DatabaseSeeder (backend) ✅ FEITO

**Arquivo:** `database/seeders/DatabaseSeeder.php`

Adicionadas chamadas aos seeders de módulo no método `run()`:
```php
$this->call([
    \App\Modules\Admin\Database\Seeders\PhysioAreaSeeder::class,
    \App\Modules\Admin\Database\Seeders\PhysioSubareaSeeder::class,
    \App\Modules\Admin\Database\Seeders\BodyRegionSeeder::class,
]);
```

---

### Fase 2 — Infraestrutura de API no SPA

Criar a camada de serviço que todas as páginas vão usar.

#### 2.1 Cliente HTTP com JWT
**Arquivo novo:** `spa/src/lib/api.ts`
- Configurar Axios com `baseURL` apontando para a API Laravel
- Interceptor de request: adicionar `Authorization: Bearer <token>` do localStorage
- Interceptor de response: tratar 401 (expirou o token → logout ou refresh)

#### 2.2 Auth Context (gerenciamento de sessão)
**Arquivo novo:** `spa/src/domain/auth/AuthContext.tsx`
- Guardar JWT token, role (`admin` | `clinic` | `patient`), e dados do usuário
- Funções: `login(role, email, password)`, `logout()`, `isAuthenticated()`
- Persistência no `localStorage`

#### 2.3 Rotas protegidas
**Arquivo novo:** `spa/src/components/PrivateRoute.tsx`
- Verificar se autenticado e se a role bate com a rota
- Redirecionar para `/` (login) se não autenticado

#### 2.4 Services por módulo (em `infrastructure/repositories/`)
Criar arquivos de serviço que encapsulam chamadas à API:
- `spa/src/infrastructure/repositories/adminExerciseRepository.ts` — exercícios admin
- `spa/src/infrastructure/repositories/clinicRepository.ts` — clínicas
- `spa/src/infrastructure/repositories/patientRepository.ts` — pacientes
- `spa/src/infrastructure/repositories/treatmentPlanRepository.ts` — planos de tratamento
- `spa/src/infrastructure/repositories/exerciseRepository.ts` — exercícios para clinic

---

### Fase 3 — Login Real com JWT

**Arquivo a modificar:** `spa/src/pages/LoginPage.tsx`

Converter de mock para:
- Formulário com React Hook Form + Zod
- Detectar role pelo email ou adicionar seletor de tipo (Admin / Clínica / Paciente)
- Chamar o endpoint correto: `POST /api/admin/auth/login`, `/api/clinic/auth/login` ou `/api/patient/auth/login`
- Salvar JWT e redirecionar para dashboard correto
- Exibir erros com Sonner toast

**Atualização:** `spa/src/App.tsx`
- Envolver rotas com `AuthProvider`
- Aplicar `PrivateRoute` nas rotas existentes
- Adicionar rotas faltantes (exercícios admin, paciente portal, etc.)

---

### Fase 4 — Páginas de Exercícios Admin (portar do fisio)

Fisio tem: `pages/admin/exercises/index.tsx`, `create.tsx`, `edit.tsx`, `show.tsx`
Clinic-app precisa: criar equivalentes em `spa/src/pages/admin/exercises/`

**Conversão Inertia → SPA:**

| fisio (Inertia) | clinic-app (SPA) |
|---|---|
| `usePage().props.exercises` | `useQuery(['exercises'], adminExerciseRepository.list)` |
| `useForm()` do Inertia | `useForm()` do React Hook Form + `zodResolver` |
| `router.post('/admin/exercises')` | `useMutation` → `adminExerciseRepository.create()` |
| `<Link href={route('...')}>` | `<Link to="/admin/exercicios">` do React Router |
| Flash messages Inertia | `toast.success()` do Sonner |

**Arquivos a criar:**
- `spa/src/pages/admin/exercises/ExercisesIndexPage.tsx` — listagem com filtros, paginação
- `spa/src/pages/admin/exercises/NewExercisePage.tsx` — formulário de criação (upload de vídeo/thumbnail via R2 presigned URL)
- `spa/src/pages/admin/exercises/EditExercisePage.tsx` — formulário de edição
- `spa/src/pages/admin/exercises/ExerciseDetailPage.tsx` — visualização

**Rotas a adicionar em `App.tsx`:**
```tsx
<Route path="/admin/exercicios" element={<ExercisesIndexPage />} />
<Route path="/admin/exercicios/novo" element={<NewExercisePage />} />
<Route path="/admin/exercicios/:id" element={<ExerciseDetailPage />} />
<Route path="/admin/exercicios/:id/editar" element={<EditExercisePage />} />
```

---

### Fase 5 — Conectar Páginas Existentes à API Real

Substituir mock data por React Query nas páginas já existentes:

#### 5.1 `PatientsPage.tsx` (clinic)
- `useQuery(['patients'], patientRepository.list)` com paginação + busca
- Remover mock data `mockPatients`

#### 5.2 `PatientDetailPage.tsx` (clinic)
- `useQuery(['patient', id], patientRepository.get)`
- Mostrar planos de tratamento reais do paciente

#### 5.3 `NewPatientPage2.tsx` → `NewPatientPage.tsx` (clinic)
- `useMutation` → `patientRepository.create()`
- Validação Zod conforme `StorePatientRequest` do backend

#### 5.4 `ExercisesPage.tsx` (clinic)
- `useQuery(['exercises', filters], exerciseRepository.list)` com todos os filtros
- `useMutation` para toggle favorito

#### 5.5 `NewProgramPage.tsx` / `ProgramDetailPage.tsx` (clinic)
- Conectar wizard ao `treatmentPlanRepository`
- `useMutation` → `treatmentPlanRepository.create()` / `update()`

#### 5.6 `AdminDashboardPage.tsx` e `DashboardPage.tsx`
- Buscar dados reais via API (substituir stats/listas hardcoded)

#### 5.7 Páginas admin (Clinics, Features, Plans)
- Conectar `ClinicsPage`, `FeaturesPage`, `PlansPage` às APIs reais
- Adicionar páginas de **edição**: `EditClinicPage.tsx`, `EditFeaturePage.tsx`, `EditPlanPage.tsx`

---

### Fase 6 — Portal do Paciente (novo)

Não existe em nenhum dos dois projetos no SPA. fisio tem as páginas Inertia, mas precisam ser adaptadas.

**Arquivos a criar:**
- `spa/src/pages/patient/PatientDashboardPage.tsx` — lista dos planos de tratamento do paciente
- `spa/src/components/patient/PatientLayout.tsx` — layout simples para o paciente

**Rotas a adicionar:**
```tsx
<Route path="/paciente" element={<PatientDashboardPage />} />
```

---

## Arquivos Críticos

### Backend
- `database/seeders/DatabaseSeeder.php` — ✅ corrigido
- `app/Modules/Admin/Database/Seeders/PhysioAreaSeeder.php` — referência
- `app/Modules/Admin/Database/Seeders/PhysioSubareaSeeder.php` — referência
- `app/Modules/Admin/Database/Seeders/BodyRegionSeeder.php` — referência
- `app/Modules/Admin/Routes/admin.php` — rotas de exercícios existem
- `app/Modules/Clinic/Routes/clinic.php` — rotas de planos/exercícios existem

### Frontend SPA a criar/modificar
- `spa/src/lib/api.ts` — **novo**
- `spa/src/domain/auth/AuthContext.tsx` — **novo**
- `spa/src/components/PrivateRoute.tsx` — **novo**
- `spa/src/infrastructure/repositories/*.ts` — **novos** (5 arquivos)
- `spa/src/pages/LoginPage.tsx` — modificar
- `spa/src/App.tsx` — modificar (novas rotas)
- `spa/src/pages/admin/exercises/*.tsx` — **4 novos**
- `spa/src/pages/admin/EditClinicPage.tsx` — **novo**
- `spa/src/pages/admin/EditFeaturePage.tsx` — **novo**
- `spa/src/pages/admin/EditPlanPage.tsx` — **novo**
- `spa/src/pages/clinic/PatientsPage.tsx` — modificar
- `spa/src/pages/clinic/PatientDetailPage.tsx` — modificar
- `spa/src/pages/clinic/NewPatientPage2.tsx` — modificar
- `spa/src/pages/clinic/ExercisesPage.tsx` — modificar
- `spa/src/pages/clinic/NewProgramPage.tsx` — modificar
- `spa/src/pages/patient/PatientDashboardPage.tsx` — **novo**

### Referência no fisio (para adaptar)
- `../fisio/modules/Admin/Http/Controllers/ExercisesController.php` — lógica de exercícios
- `../fisio/resources/js/pages/admin/exercises/` — UI de referência
- `../fisio/resources/js/pages/clinic/treatment-plans/create.tsx` — wizard de referência
- `../fisio/resources/js/components/clinic/treatment-plan-wizard/` — componentes do wizard

---

## Ordem de Execução Recomendada

```
1. Fix DatabaseSeeder (backend)          ✅ FEITO
2. API client + AuthContext + services   ← fundação do SPA
3. Login real com JWT                    ← autenticação funcional
4. Admin: exercícios CRUD               ← funcionalidade central
5. Clinic: pacientes conectados à API   ← funcionalidade central
6. Clinic: exercícios conectados à API  ← funcionalidade central
7. Clinic: treatment plan conectado     ← funcionalidade central
8. Admin: edição de clínicas/planos/features
9. Portal do paciente
```

---

## Verificação (como testar)

```bash
# 1. Backend seeders
php artisan migrate:fresh --seed
# Verificar: tabelas physio_areas, physio_subareas, body_regions com dados

# 2. Auth JWT
curl -X POST http://localhost:8000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cleverton94fla@gmail.com","password":"12345678"}'
# Deve retornar access_token

# 3. Frontend
cd spa && npm run dev
# Acessar http://localhost:5173 e fazer login como admin
# Navegar para /admin/exercicios — deve listar exercícios reais
# Navegar para /clinic/pacientes — deve listar pacientes reais
```
