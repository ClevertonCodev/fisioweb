# HANDOFF — Treatment Program Extraction (continuar a implementação)

**Branch:** `010-treatment-program-extraction` (já criado; trabalhe nele).
**Plano/tarefas:** `specs/010-treatment-program-extraction/{plan.md,tasks.md,research.md,data-model.md,contracts/}`.
**Convenções obrigatórias:** PHP sem `declare(strict_types=1)`; use `is_null()`/`! is_null()` e `empty()`/`! empty()`; Controller→ServiceInterface; Service→RepositoryInterface; eventos `final readonly` via `DB::afterCommit`, só IDs+snapshot (nunca Model); relações cross-module em Models por **FQN inline** (`\Modules\...::class`, sem `use`); nada em `bootstrap/providers.php`.

## Estado atual (o que JÁ está feito e verde)

Fases 1–4 concluídas; Fase 5 (eventos) em andamento.

- **Módulo criado** `modules/TreatmentProgram/` (module.json, composer.json, config, 3 providers, routes/clinic.php). Registrado em `modules_statuses.json` (`"TreatmentProgram": true`). `composer dump-autoload` já rodado (namespace ativo).
- **Código movido via `git mv`** (Models, Controllers, Requests, Service, Repository, Contracts, Policy, Observer, Seeder, 5 migrations, 4 testes) e namespaces reescritos para `Modules\TreatmentProgram\...`.
- **Models** usam FQN inline para Clinic/ClinicUser/Patient/PhysioArea/PhysioSubarea/Exercise. `Clinic.php`/`ClinicUser.php` (módulo Clinic) apontam `treatmentPlans()` via FQN inline.
- **Clinic limpo:** rotas de prescrição removidas de `modules/Clinic/routes/clinic.php`; binds/observer/policy removidos de `ClinicServiceProvider`; `ClinicDatabaseSeeder` importa `TreatmentPlanSeeder` do novo módulo; `DashboardAggregateTest` importa `TreatmentPlan` do novo módulo.
- **US1 dashboard:** `TreatmentProgramReadServiceInterface` (`app/Contracts/Public/`) + impl `app/Repositories/TreatmentProgramReadService.php` (assinatura usa **`string $monthStart,$monthEnd`** — Y-m-d, não Carbon). `Clinic/DashboardRepository` injeta o contrato e delega `activeProgramsCount`. **Verde.**
- **US1 route-compat:** `tests/Architecture/TreatmentProgramRouteCompatibilityTest.php` (14 asserts) — **verde**.
- **US2 Admin contracts:** `modules/Admin/app/Contracts/Public/{ExerciseCatalogReadServiceInterface,ExercisePrescriptionDefaults,ProgramCatalogReadServiceInterface}.php` + `modules/Admin/app/Services/{ExerciseCatalogReadService,ProgramCatalogReadService}.php`, bindados em `AdminServiceProvider`. `TreatmentPlanService::addExercise` usa `ExerciseCatalogReadServiceInterface` (sem `Modules\Admin\Models\Exercise`). `SharedProgramController` usa `ProgramCatalogReadServiceInterface` (sem `AdminProgram`).
- **US2 ProgramDraft:** `ProgramDraft{Service,Repository}Interface` + impls; `ProgramDraftController` depende do ServiceInterface (sem query no controller). **Obs.: `ProgramDraftService` ainda NÃO dispara eventos** (fazer na US3).
- **US2 fitness tests:** `ModuleBoundaryTest` estendido (scan TreatmentProgram + controller→ServiceInterface tolerando `PdfService` + service→RepositoryInterface) — **verde (13)**. `ExtractionReadinessTest` estendido (migrations location + readiness + **events_do_not_reference_models**, que exige eventos existirem). Fixtures `clinic-capability-map.php` (capability `treatment_program` extracted, substituiu `care`) e `extraction-readiness.php` (entrada `TreatmentProgram`) atualizados.
- **US2 contract tests:** `modules/Admin/tests/Feature/ExerciseCatalogReadServiceTest.php`, `modules/TreatmentProgram/tests/Feature/{TreatmentProgramReadServiceTest,SharedProgramControllerTest}.php`.
- **US3 (parcial):** os **7 event classes** já existem em `modules/TreatmentProgram/app/Events/` (Created, Activated, Completed, Archived, ProgramDraftCreated, ProgramDraftUpdated, ProgramDraftConvertedToTreatmentPlan) — payloads conforme `contracts/integration-events.md`. `EventServiceProvider` já mapeia `TreatmentPlanActivated → SendTreatmentPlanActivationNotification` (listener AINDA não existe → criar).
- Interim: `TreatmentProgramServiceProvider::boot()` ainda registra `TreatmentPlan::observe(TreatmentPlanObserver::class)` e o observer ainda existe em `app/Observers/`.

**Suites verdes hoje:** `modules/TreatmentProgram/tests` (25 originais), `DashboardAggregateTest` (5), `ModuleBoundaryTest` (13), `TreatmentProgramRouteCompatibilityTest` (14), `ExerciseCatalogReadServiceTest`.

## ⚠️ BLOQUEIO conhecido (resolver na US3)

Módulo `WhatsApp` está `false` em `modules_statuses.json` → `Modules\WhatsApp\Jobs\SendWhatsAppMessageJob` **não é instanciável** (bind `WhatsAppServiceInterface` ausente). Ao criar plano **ativo + com patient_id + telefone**, o observer interino dispara o job síncrono e **quebra** (`BindingResolutionException`). Por isso `TreatmentProgramReadServiceTest` está falhando agora.
- Os 25 testes originais passam porque criam planos ativos **sem patient_id** (guard do observer retorna cedo).
- **Correção:** remover o observer (US3). Depois, `TreatmentPlan::create(...)` não dispara nada (eventos de domínio saem do Service, não de model events). Em testes que criam plano ativo **via endpoint/Service com patient+telefone**, usar `Queue::fake()`.

## O que FALTA fazer (ordem)

### US3 — Eventos (T037–T042)
1. **Verificar padrão afterCommit + RefreshDatabase** antes de codar: leia `modules/ClinicScheduling/app/Services/AppointmentService.php` (como faz `DB::afterCommit(fn()=>Event::dispatch(...))`) e um teste de evento de scheduling (ex. em `modules/ClinicScheduling/tests`) para ver se usam `Event::fake()` e se há gotcha com `RefreshDatabase` (afterCommit pode não disparar dentro da transação de teste — confirme como o projeto resolve; provavelmente `Event::fake()` + dispatch direto, ou o projeto não usa transação de teste para esses).
2. **`TreatmentPlanService` (T037):** injetar `ProgramDraftRepositoryInterface`; obter `actorId = Auth::guard('clinic')->id()`. Em `create()`: após persistir, `DB::afterCommit` → sempre `TreatmentPlanCreated`; se `status===active && !empty(patient_id)` → `TreatmentPlanActivated` (`startedAt` = `start_date` ou now, string); best-effort `ProgramDraftConvertedToTreatmentPlan` se `programDraftRepository->existsForUser(actorId)`. Em `update()`: comparar `$oldStatus` vs novo → `active`⇒Activated, `completed`⇒Completed, `cancelled`⇒Archived. Manter os `activityLogger->log(...)` existentes (NÃO remover — feed do dashboard). `occurredAt = CarbonImmutable::now()`.
3. **`ProgramDraftService` (T038):** em `upsertForUser`, após `[$draft,$wasCreated]=repo->upsert(...)`, dispatch afterCommit `ProgramDraftCreated` (se `$wasCreated`) senão `ProgramDraftUpdated`.
4. **Listener (T039):** criar `modules/TreatmentProgram/app/Listeners/SendTreatmentPlanActivationNotification.php` reagindo a `TreatmentPlanActivated`. Injetar `Modules\Patient\Contracts\PatientServiceInterface` (usar `find($patientId)` → phone/clinic_id) e carregar `message` do plano via `TreatmentPlanRepositoryInterface`. Replicar guard atual do observer (status active, patient_id, phone não vazio, `patient.clinic_id === plan.clinic_id`, fallback de mensagem `'Ola! Seu programa de tratamento esta disponivel no app.'`) e `SendWhatsAppMessageJob::dispatch(to,body)`. Verifique a assinatura real de `PatientServiceInterface::find` (retorna `?Patient`).
5. **Remover observer (T040):** em `TreatmentProgramServiceProvider` remover `TreatmentPlan::observe(...)` e o `use ...Observer`; `git rm modules/TreatmentProgram/app/Observers/TreatmentPlanObserver.php`. (EventServiceProvider já registra o listener.)
6. **Testes (T041/T042):** converter `TreatmentPlanObserverTest` em teste do listener (Queue::fake, mesmas condições de disparo/não-disparo). Criar testes de evento: `Event::fake([...7...])` e por caso de uso (create/activate/complete/archive; draft upsert/convert) asserir dispatch. Ajustar `TreatmentPlanControllerTest`/`TreatmentProgramReadServiceTest` que criem plano ativo com patient+telefone para `Queue::fake()`. Rodar `vendor/bin/phpunit modules/TreatmentProgram/tests`.

### Polish (T043–T047)
7. **ADR** `docs/adr/010-treatment-program-extraction.md`: TreatmentProgram dono da prescrição; paths/tabelas preservados; migrations no módulo; Clinic sem novas regras; leituras Patient/Admin/Media via ID/contrato/DTO/read model; **acoplamento aceito `Modules\Clinic\Contracts\ActivityLoggerInterface`** (motivo=preservar feed do dashboard; teste de contenção=ModuleBoundaryTest não o proíbe pois é ServiceInterface; plano de remoção=migrar p/ listener no Clinic + evento de exercises). Espelhar estilo de `docs/adr/009-clinical-record-extraction.md`.
8. **Atualizar** `docs/architecture/clinic-capability-map.md` (treatment_program → extracted) e `docs/architecture/extraction-readiness-checklist.md`.
9. **Doc drift (opcional):** `contracts/public-contracts.md` e `data-model.md` dizem `CarbonInterface` no read do dashboard — a impl usa `string` (Y-m-d). Ajustar para `string`.
10. `./vendor/bin/pint`.
11. **Validações finais (registrar saídas):** `vendor/bin/phpunit tests/Architecture`; `vendor/bin/phpunit modules/TreatmentProgram/tests`; `vendor/bin/phpunit modules/Admin/tests`; `vendor/bin/phpunit modules/Clinic/tests/Feature/Dashboard`; `php artisan route:list --path=clinic`; `php artisan migrate:fresh --seed`. Smoke: dashboard `active_programs` e `dashboard/activities` (program_created/program_completed/exercises_added) inalterados.
12. **Marcar `[X]`** as tarefas em `specs/010-treatment-program-extraction/tasks.md` conforme conclui.

## Pontos de atenção
- **Não** reintroduzir `use Modules\X\Models\...` em produção de TreatmentProgram (o `ModuleBoundaryTest` quebra). Policies usam `$user` sem type-hint. Models usam FQN inline.
- Preservar EXATAMENTE shapes REST: `treatment-plans` (`{data}`, 201/200/404), `program-drafts` (`{data: draft|null}`, mensagens), `programs.index` (paginador **direto**, sem `data`), `programs.show` (`{data}`, 404 findOrFail).
- Rotas finais têm prefixo de nome `api.` (ex. `api.clinic.treatment-plans.index`) — já confirmado no route:list.
- PDF blade é app-level (`resources/views/pdf/clinic/treatment/treatment-plan.blade.php`) — não mover.
- Não commitar/PR a menos que o usuário peça (guidance do repo). Terminar com `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` se for commitar.
