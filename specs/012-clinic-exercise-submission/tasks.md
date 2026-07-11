# Tasks: Clinic Exercise Submission & Admin Approval

**Feature**: `012-clinic-exercise-submission` · **Plan**: [plan.md](./plan.md)

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [research.md](./research.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluídos (o projeto usa PHPUnit + Vitest e a spec define critérios verificáveis). Tarefas de teste marcam os fluxos críticos de autorização e visibilidade.

**Convenções**: Backend em `modules/`, frontend DDD em `resources/js/`. Após tarefas de schema, o app usa `migrate:fresh --seed` (sem migration nova — decisão do usuário).

---

## Phase 1: Setup

- [x] T001 Confirmar ambiente e baseline verde: rodar `composer run test`, `npm run test`, `npm run types`, `./vendor/bin/pint --test` no repo e anotar falhas pré-existentes antes de alterar código.

---

## Phase 2: Foundational (blocking prerequisites)

**Bloqueia todas as user stories** — schema, model e escopo de visibilidade são base comum.

- [x] T002 Alterar migration `modules/Admin/database/migrations/2026_02_28_000007_create_admin_exercises_table.php`: adicionar `clinic_id` (nullable, FK `clinics` nullOnDelete), `review_status` (string default `approved`), `submitted_by_clinic_user_id` (nullable FK clinic users nullOnDelete), `reviewed_by` (nullable FK `users` nullOnDelete), `reviewed_at` (nullable timestamp); tornar `created_by` e `body_region_id` nullable; índices em `clinic_id` e `review_status`.
- [x] T003 Atualizar `modules/Admin/app/Models/Exercise.php`: adicionar consts `REVIEW_PENDING/APPROVED/REJECTED` + `REVIEW_STATUSES`; incluir novas colunas em `$fillable`; cast `reviewed_at => datetime`; relações `clinic()`, `submittedByClinicUser()`, `reviewedBy()` (FQN inline); scopes `approved()`, `pending()`, `visibleToClinic(int $clinicId)`.
- [x] T004 [P] Atualizar seeder `modules/Admin/database/seeders/ExerciseSeeder.php`: setar `review_status = approved` e `clinic_id = null` nos exercícios oficiais; adicionar 1–2 exercícios `pending` vinculados a uma clínica seed para validar o fluxo de revisão.
- [x] T005 Estender contrato `modules/Admin/app/Contracts/ExerciseServiceInterface.php` e `ExerciseRepository::paginate` (`modules/Admin/app/Repositories/ExerciseRepository.php`) para aceitar filtro `review_status` e um `visibleToClinicId` opcional que aplica o scope `visibleToClinic` (globais aprovados + próprios da clínica).
- [x] T006 Recriar o schema local: `php artisan migrate:fresh --seed` e confirmar que `admin_exercises` tem as novas colunas e os seeders rodam sem erro.

**Checkpoint**: Schema + model + escopo prontos. User stories podem começar.

---

## Phase 3: User Story 1 — Clínica envia exercício próprio (Priority: P1) 🎯 MVP

**Goal**: Admin da clínica envia exercício (vídeo + metadados); fica `pending`, visível só para a própria clínica, com aviso no form e badge no card.

**Independent Test**: Enviar pela clínica A → aparece na biblioteca de A com badge; não aparece em B; não-admin da clínica não consegue enviar.

### Backend (US1)

- [x] T007 [US1] Criar `modules/Admin/app/Contracts/Public/ExerciseSubmissionServiceInterface.php` com `submit(array $data, int $clinicId, int $clinicUserId): Exercise`.
- [x] T008 [US1] Criar `modules/Admin/app/Services/ExerciseSubmissionService.php` implementando `submit()`: cria Exercise com `review_status = pending`, `clinic_id`, `submitted_by_clinic_user_id`, associa `video_id` via `admin_exercise_video`; registrar bind do contrato no provider do módulo Admin (`modules/Admin/app/Providers`).
- [x] T009 [US1] Criar `modules/Clinic/app/Http/Requests/SubmitExerciseRequest.php`: `authorize()` exige `ClinicUser::isAdmin()`; regras de `name`, `physio_area_id`, `difficulty_level`, `description`, `video_id` conforme [contracts/clinic-exercise-submission.md](./contracts/clinic-exercise-submission.md).
- [x] T010 [US1] Adicionar `store()` em `modules/Clinic/app/Http/Controllers/ExerciseController.php` (injeta `ExerciseSubmissionServiceInterface`), usando `SubmitExerciseRequest` e o `clinic_id`/id do usuário do guard `clinic`; retorna `201` com envelope `data`.
- [x] T011 [US1] Alterar `index()` do `modules/Clinic/app/Http/Controllers/ExerciseController.php` para passar `visibleToClinicId = clinic_id atual`, e enriquecer cada item com `is_own_submission` e `review_status` (sem expor `clinic_id` cru).
- [x] T012 [US1] Registrar rota `POST clinic/exercises` em `modules/Clinic/routes/clinic.php` (grupo `clinic.exercises`, middleware `auth:clinic`+`clinic.guard`).

### Frontend (US1)

- [x] T013 [P] [US1] Atualizar `resources/js/domain/clinic/exercise.ts`: adicionar `reviewStatus: 'pending'|'approved'|'rejected'` e `isOwnSubmission: boolean`.
- [x] T014 [US1] Atualizar mapper e adicionar método `submit` em `resources/js/infrastructure/repositories/api-clinic-exercises.ts` (mapper snake→camel dos novos campos; POST `clinic/exercises` via `apiClient`).
- [x] T015 [US1] Criar hook `resources/js/application/clinic/use-submit-exercise.ts`: orquestra `usePresignedUpload` (vídeo/thumb) + mutation de submissão; invalida a query da biblioteca no sucesso.
- [x] T016 [US1] Criar página `resources/js/pages/clinic/ClinicSubmitExercisePage.tsx` (form RHF+Zod: nome, categoria=physio_area, dificuldade, descrição + upload de vídeo/thumb/duração no estilo `AdminVideoCreatePage`), incluindo o **aviso** de que, se aprovado, outras clínicas poderão ver (FR-005).
- [x] T017 [US1] Adicionar botão "Enviar exercício" (guardado por `RequireClinicAdmin`) na `resources/js/pages/clinic/ExercisesPage.tsx` e registrar a rota da página de envio em `resources/js/routes/clinic/`.
- [x] T018 [P] [US1] Exibir badge "disponível apenas para a clínica que enviou" em `resources/js/components/ExerciseCard.tsx` quando `isOwnSubmission && reviewStatus !== 'approved'`.

### Tests (US1)

- [x] T019 [P] [US1] Teste Feature `modules/Clinic/tests/Feature/ExerciseSubmissionTest.php`: admin da clínica cria exercício `pending`; escopo de visibilidade (A vê, B não vê — SC-002); não-admin recebe `403` (FR-012a); `video_id` inválido → `422`.
- [x] T020 [P] [US1] Teste Vitest `resources/js/test/clinic-submit-exercise.test.tsx`: form valida campos obrigatórios, exibe o aviso e chama a submissão; e badge aparece no card para envio próprio não aprovado.

**Checkpoint**: US1 entregável e testável de forma independente (MVP).

---

## Phase 4: User Story 2 — Admin revisa e aprova (Priority: P2)

**Goal**: Admin do sistema vê contador de pendentes no dashboard, lista pendentes, aprova (vira global) ou rejeita (fica privado da clínica).

**Independent Test**: Com um exercício `pending` (seed/US1), aprovar via admin → aparece na clínica B; rejeitar → permanece só na clínica de origem com badge.

### Backend (US2)

- [x] T021 [US2] Criar `ExercisePolicy` (`modules/Admin/app/Policies/ExercisePolicy.php`) com `review`/`approve`/`reject` permitidos apenas ao guard `admin`; registrar no provider do módulo Admin.
- [x] T022 [US2] Adicionar métodos `approve(int $id)`, `reject(int $id, ?string $reason)`, `pendingCount(): int` ao `ExerciseSubmissionService` (grava `review_status`, `reviewed_by`, `reviewed_at`) e ao contrato correspondente.
- [x] T023 [US2] Criar `modules/Admin/app/Http/Requests/ReviewExerciseRequest.php` (autoriza via policy; `reason` opcional) e `modules/Admin/app/Http/Controllers/ExerciseReviewController.php` com `pendingCount`, `approve`, `reject`.
- [x] T024 [US2] Registrar rotas em `modules/Admin/routes/admin.php` (grupo `exercises`): `GET pending-count`, `PUT {id}/approve`, `PUT {id}/reject`; e suportar filtro `review_status` no `index` existente.

### Frontend (US2)

- [x] T025 [P] [US2] Adicionar `pendingCount`, `approve`, `reject` em `resources/js/infrastructure/repositories/api-admin-exercises.ts` e o hook correspondente em `resources/js/application/admin/use-admin-exercises.ts`.
- [x] T026 [US2] Exibir card/badge "N exercícios a revisar" (link para pendentes) em `resources/js/pages/admin/AdminDashboardPage.tsx` consumindo o `pendingCount` (FR-007, SC-004).
- [x] T027 [US2] Criar visão de revisão `resources/js/pages/admin/exercises/AdminExerciseReviewPage.tsx` (ou aba filtrada em `AdminExercisesIndexPage`): lista `review_status = pending` com vídeo/metadados e ações Aprovar/Rejeitar; registrar rota em `resources/js/routes/admin/exercise-routes.tsx`.

### Tests (US2)

- [x] T028 [P] [US2] Teste Feature `modules/Admin/tests/Feature/ExerciseReviewTest.php`: admin aprova → fica visível para todas as clínicas (SC-003) e grava `reviewed_by/at` (FR-013); rejeita → permanece só na origem (FR-010); guard não-admin recebe `403` (FR-012); `pending-count` correto.

**Checkpoint**: US1 + US2 = feature completa.

---

## Phase 5: Polish & Cross-Cutting

- [x] T029 [P] Rodar `./vendor/bin/pint` e `npm run format` nos arquivos alterados; garantir `npm run types` e `npm run lint` limpos.
- [x] T030 Executar o [quickstart.md](./quickstart.md) (Cenários 1 e 2) manualmente e confirmar o mapa requisito→verificação; rodar `composer run test` e `npm run test` completos.

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T006)** bloqueiam tudo.
- **US1 (T007–T020)** depende só do Foundational → é o **MVP**.
- **US2 (T021–T028)** depende do Foundational; usa exercícios `pending` (seed ou criados por US1) — pode ser desenvolvida em paralelo a US1 após o checkpoint da Phase 2, mas o teste de ponta-a-ponta assume US1/seed.
- **Polish (T029–T030)** por último.

### Oportunidades paralelas
- Foundational: T004 [P] paralelo a T005 (arquivos distintos).
- US1: T013/T018 [P] (domínio/card) e T019/T020 [P] (testes) paralelos entre si; backend (T007–T012) e frontend (T013–T018) podem correr em paralelo após T005.
- US2: T025 [P] e T028 [P] paralelos.

## Implementation Strategy

- **MVP** = Phase 1 + Phase 2 + **US1** (T001–T020): clínica já cria e vê seus exercícios privados com aviso e badge.
- **Incremento** = **US2** (T021–T028): compartilhamento global via aprovação do admin.
- Entrega final validada pelo **Polish** (T029–T030).
