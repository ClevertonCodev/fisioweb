# Tasks: Ajuste de Seeds — Funcionalidades, Planos, Clínicas e Mídias

**Input**: Design documents from `/specs/013-seed-plans-clinics/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Não solicitados formalmente; validação via quickstart (`migrate:fresh --seed` + reexecução). Nenhuma task de teste automatizado nova — a suíte existente (`composer run test`) roda na fase de polish.

**Organization**: Agrupado por user story (US1 catálogo, US2 clínicas, US3 mídias).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

Nenhuma task de setup — projeto já configurado; nenhuma migração de schema necessária.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Novas chaves de funcionalidade válidas antes de qualquer seed.

- [X] T001 Substituir `ALLOWED_KEYS` em `modules/Admin/app/Models/Feature.php` pelas 4 chaves reais (`agenda`, `programas_exercicios`, `financas`, `app`), removendo `KEY_VIDEO_CALL` e `teste1..10`; verificar/ajustar usos residuais em `modules/Admin/app/Http/Requests/StoreFeatureRequest.php`, `UpdateFeatureRequest.php` e `FeatureController.php`

---

## Phase 3: User Story 1 — Catálogo de funcionalidades e planos (P1)

**Goal**: Seed cria as 4 funcionalidades com valores isolados e os 3 planos por usuário com vínculos corretos.

**Independent Test**: `php artisan migrate:fresh --seed` → consultas do quickstart mostram 4 features (10/15/5/20) e 3 planos (Start 20/15 sem features; Performance 30/25 com 3; Premium 40/35 com 4).

- [X] T002 [US1] Criar `modules/Admin/database/seeders/PlanFeatureSeeder.php`: `updateOrCreate` das 4 features por `key` (valores conforme data-model.md), remoção de features com chaves fora do novo conjunto (incluindo vínculos `admin_feature_plans` órfãos), `updateOrCreate` dos 3 planos por `name` (`type_charge = Plan::TYPE_CHARGE_POR_USUARIO`) e sincronização dos vínculos feature↔plano por plano
- [X] T003 [US1] Registrar `PlanFeatureSeeder` no início do `$this->call([...])` (ou antes da criação de clínicas) em `database/seeders/DatabaseSeeder.php`
- [X] T004 [P] [US1] Atualizar mock estático `resources/js/infrastructure/repositories/mock-features.ts` removendo `video_call` e refletindo as 4 chaves novas

**Checkpoint**: Catálogo comercial validável isoladamente via tinker.

---

## Phase 4: User Story 2 — Uma clínica por plano (P1)

**Goal**: Cleverton vira Premium (doc 856.283.250-23); Clínica Start e Clínica Performance criadas com plano, documento, admin e volume de dados proporcional.

**Independent Test**: Após seed, 3 clínicas com `plan_id` e documentos corretos; login `start@fisioweb.local`/`12345678` funciona; reexecução do seed não duplica.

- [X] T005 [US2] Atualizar `database/seeders/DatabaseSeeder.php`: resolver planos por nome; `updateOrCreate` da Clínica Cleverton (e-mail mantido) com `plan_id` Premium e documento `856.283.250-23` (seguir formato de armazenamento vigente); criar Clínica Start (`start@fisioweb.local`, doc `726.868.590-40`, plano Start) e Clínica Performance (`performance@fisioweb.local`, doc `74.760.866/0001-37`, plano Performance), cada uma com `ClinicUser` admin (role admin, mestre yes, status active, senha `12345678`) e 1 paciente básico para a Start
- [X] T006 [US2] Retarget `modules/Patient/database/seeders/PatientDatabaseSeeder.php`: substituir `Clinic::query()->orderBy('id')->limit(2)` por seleção das clínicas Premium e Performance (por e-mail); Start fica fora da massa de 50 pacientes
- [X] T007 [P] [US2] Retarget `modules/Clinic/database/seeders/DashboardDemoSeeder.php`: de `limit(2)` para clínicas Premium e Performance
- [X] T008 [P] [US2] Retarget `modules/ClinicFinance/database/seeders/FinancialDemoSeeder.php`: de `limit(2)` para clínicas Premium e Performance
- [X] T009 [P] [US2] Retarget `modules/Clinic/database/seeders/ClinicPatientDataSeeder.php`: de `Clinic::all()` para clínicas Premium e Performance (Start sem dados clínicos de demonstração)
- [X] T010 [US2] Revisar `modules/Clinic/database/seeders/ClinicUserSeeder.php` e `modules/TreatmentProgram/database/seeders/TreatmentPlanSeeder.php` quanto ao escopo por clínica: extras/demo permanecem na Premium (e Performance quando o módulo pertence ao plano), sem tocar a Start

**Checkpoint**: Três clínicas logáveis, dados proporcionais ao plano, seed idempotente.

---

## Phase 5: User Story 3 — Mídias novas do bucket R2 (P2)

**Goal**: Fotos, thumbnails e vídeos semeados apontam para as URLs fornecidas.

**Independent Test**: Consultas do quickstart mostram foto única `2cc94b05-…png` em pacientes/usuários e os 2 vídeos com novos arquivos/thumbnails; URLs abrem no navegador.

- [X] T011 [P] [US3] Reduzir `PHOTOS` em `modules/Patient/database/seeders/PatientDatabaseSeeder.php` para o único arquivo `2cc94b05-8e9c-465a-b42a-6c40b473bf59_1783781535.png` e garantir atualização de fotos antigas na reexecução (update incondicional de `photo_url`, não só `whereNull`)
- [X] T012 [P] [US3] Idem em `modules/Clinic/database/seeders/ClinicUserSeeder.php` (mesma foto única, atualização na reexecução)
- [X] T013 [US3] Atualizar `modules/Media/database/seeders/VideoSeeder.php`: vídeo 1 → `videos/bf6fd593-97ff-4bc2-be31-469a5e0a6c00_1783782291.mp4` + `thumbnails/videos/31fa195c-d9f5-49e6-bb57-78da4d32b932_1783558953.png`; vídeo 2 → `videos/7cb1e772-ea99-4564-9478-82198e60d9eb_1783558952.mp4` + `thumbnails/videos/139645c7-fa38-4679-a24c-2c3113a8fecc_1783782292.jpeg`; preservar ids 1 e 2 (contrato com `ExerciseSeeder`) atualizando os registros existentes em vez de criar novos (ex.: `updateOrCreate` por id/posição, com filenames novos)

**Checkpoint**: Mídias de demonstração carregando do R2 com as URLs novas.

---

## Phase 6: Polish & Validação

- [X] T014 Executar quickstart completo: `php artisan migrate:fresh --seed`, consultas de validação, e `php artisan db:seed` de novo para provar idempotência (contagens estáveis: 4 features, 3 planos, 3 clínicas, 2 vídeos)
- [X] T015 [P] Rodar `./vendor/bin/pint` nos arquivos PHP tocados e `npm run types` (mock-features.ts)
- [X] T016 Rodar `composer run test` e corrigir quebras causadas pela mudança de `ALLOWED_KEYS` (ex.: testes de Feature/Plan que usem `video_call` ou `teste*`)

---

## Dependencies

- T001 (Foundational) bloqueia T002 e T016.
- US1 (T002–T004): T002 → T003; T004 paralelo.
- US2 (T005–T010): depende de T002/T003 (planos existirem); T005 → T006; T007/T008/T009 paralelos entre si após T005.
- US3 (T011–T013): independente de US1/US2; T011/T012 paralelos.
- Polish (T014–T016) por último.

**Ordem de entrega**: Phase 2 → US1 → US2 → US3 → Polish. US3 pode ser feita em paralelo com US1/US2 por outro executor (arquivos distintos).

## Parallel Examples

- Após T005: T007, T008, T009 em paralelo (arquivos distintos).
- A qualquer momento pós-T001: T004, T011, T012 em paralelo.

## Implementation Strategy

**MVP**: Phase 2 + US1 (catálogo comercial correto). Incrementos: US2 (clínicas por plano), US3 (mídias), depois validação/polish. Tudo direto na `main`, commits pequenos por fase.
