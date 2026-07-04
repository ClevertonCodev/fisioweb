# Phase 0 — Research: Treatment Program Extraction

Consolidação das decisões técnicas. Cada item: **Decisão / Justificativa / Alternativas**. Todos os "NEEDS CLARIFICATION" do Technical Context foram resolvidos (nenhum permanece).

---

## R1 — Registro do módulo

**Decisão**: Registrar `TreatmentProgram` via `module.json` (1 provider: `TreatmentProgramServiceProvider`) + flag `"TreatmentProgram": true` em `modules_statuses.json`. O provider principal registra `EventServiceProvider` e `RouteServiceProvider`. **Nunca** adicionar em `bootstrap/providers.php`.

**Justificativa**: Padrão real do projeto (`nwidart/laravel-modules`). `ClinicScheduling`, `ClinicalRecord`, `ClinicFinance`, `ClinicQuestionnaire` seguem exatamente isso. `module.json` do ClinicScheduling lista só o provider principal.

**Alternativas**: `bootstrap/providers.php` — proibido pelo enunciado e fora do padrão do projeto.

---

## R2 — Relações Eloquent cross-module (ADR-008)

**Decisão**: Nos Models de `TreatmentProgram`, declarar `belongsTo` cross-module com **FQN inline** para `Modules\Clinic\Models\Clinic`, `Modules\Clinic\Models\ClinicUser`, `Modules\Patient\Models\Patient`, `Modules\Admin\Models\PhysioArea`, `Modules\Admin\Models\PhysioSubarea`, `Modules\Admin\Models\Exercise`. Permitido **somente em Models**, para eager load e serialização JSON de responses. Proibido em Services/Repositories para decisão de negócio.

**Justificativa**: ADR-008 (ClinicScheduling) e ADR-009 (ClinicalRecord) já estabeleceram esse padrão. As responses atuais dependem de `patient`, `physioArea`, `physioSubarea`, `exercise.videos` eager-loaded — preservar shape exige as relações.

**Alternativas**: Remover relações e montar shape manualmente — quebraria contrato de response e é risco alto sem ganho nesta fase.

---

## R3 — Remover import de `Admin\Models\Exercise` do Service (FR-014)

**Decisão**: Criar contrato público `Modules\Admin\Contracts\Public\ExerciseCatalogReadServiceInterface` (impl. `ExerciseCatalogReadService`) expondo os defaults de prescrição necessários hoje em `TreatmentPlanService::addExercise`: `sets`, `repetitions`, `rest_time` por `exercise_id` (via DTO/read model). O Service passa a chamar esse contrato em vez de `Exercise::findOrFail`.

Método:
```php
public function findPrescriptionDefaults(int $exerciseId): ?ExercisePrescriptionDefaults;
```
`ExercisePrescriptionDefaults` = DTO readonly com `int $exerciseId`, `?int $sets`, `?int $repetitions`, `?int $restTime`. Se `null` (exercício inexistente), o Service mantém o comportamento atual de `findOrFail` (lança 404/ModelNotFound equivalente) — ver R11.

**Justificativa**: FR-014 + fitness test proíbem `Modules\Admin\Models\Exercise` em regra de negócio. A validação de existência já é feita no Request (`exists:admin_exercises,id`); o Service só precisa dos defaults.

**Alternativas**: FQN inline no Service — proibido (é regra de negócio). Passar defaults pelo frontend — muda contrato.

---

## R4 — Remover leitura de `Admin\Models\AdminProgram` do SharedProgramController (FR-015)

**Decisão**: Criar contrato público `Modules\Admin\Contracts\Public\ProgramCatalogReadServiceInterface` (impl. `ProgramCatalogReadService`) com dois métodos que reproduzem exatamente `index` e `show` atuais:
```php
public function paginate(array $filters, int $perPage): LengthAwarePaginator; // is_active + search + physio_area_id, with(physioArea)+withCount(exercises), latest()
public function findActiveWithDetails(int $id): ?AdminProgram; // with(physioArea, createdBy, groups.exercises.exercise.videos)+withCount(exercises), is_active
```
O `SharedProgramController` (movido para `TreatmentProgram`) chama o contrato e retorna o **mesmo** JSON (paginador direto no `index`, envelope `data` no `show`, `findOrFail`→404 no `show`).

**Justificativa**: FR-015. O shape de response é do próprio Model `AdminProgram` serializado; expor via contrato do Admin mantém a resposta idêntica sem `TreatmentProgram` importar o Model. O retorno `AdminProgram`/paginator de Models cross-module a partir de um **contrato público do Admin** é aceito (o Model é do próprio Admin, apenas atravessa a fronteira serializado — igual a `PatientServiceInterface::find(): ?Patient`).

**Alternativas**: Mapear para DTO/array — risco de divergência de shape (campos, casts, counts). Rejeitado para preservar contrato exato.

---

## R5 — Dashboard `active_programs` via contrato público de leitura (FR-020)

**Decisão**: Criar `Modules\TreatmentProgram\Contracts\Public\TreatmentProgramReadServiceInterface` (impl. `TreatmentProgramReadService`) com:
```php
public function activeProgramsCount(int $clinicId, ?int $clinicUserId, string $monthStart, string $monthEnd): int;
```
Reproduz a query atual de `DashboardRepository::activeProgramsCount`: status `active`, `whereHas('patient', activeStatus)`, `start_date <= monthEnd`, `end_date null || >= monthStart`, filtro opcional por `clinic_user_id`. `Clinic\DashboardRepository` deixa de importar `Modules\Clinic\Models\TreatmentPlan` e passa a injetar o contrato, derivando `monthStart/monthEnd` do `DashboardScope` como strings `Y-m-d`.

**Justificativa**: FR-020 + preocupação explícita do solicitante com o dashboard. Espelha `SchedulingReadServiceInterface`, que o dashboard **já** consome (`DashboardRepository` importa `Modules\ClinicScheduling\Contracts\Public\SchedulingReadServiceInterface`). Precedente idêntico.

**Alternativas**: Deixar a query no Clinic — viola ownership (FR-006/020) e o fitness test de migration/uso. Rejeitado.

---

## R6 — WhatsApp de ativação: Observer → Listener (FR-019)

**Decisão**: Remover `TreatmentPlanObserver`. Criar listener `SendTreatmentPlanActivationNotification` (em `TreatmentProgram`) que reage a `TreatmentPlanActivated`. Ele: carrega o plano pelo repositório próprio (para `message`), obtém o paciente via `PatientServiceInterface::find($patientId)` (telefone + `clinic_id`), e reproduz as condições atuais (status active, `patient_id` presente, paciente existe, `phone` não vazio, `patient.clinic_id === plan.clinic_id`, fallback de mensagem) antes de `SendWhatsAppMessageJob::dispatch(to, body)`.

`TreatmentPlanActivated` deve ser emitido em **ambas** as situações que hoje disparam o observer: (a) plano criado já com `status=active`; (b) plano que transiciona para `active` no update.

**Justificativa**: FR-019 liga o side-effect ao evento de domínio (EDA). `PatientServiceInterface::find(): ?Patient` é contrato público existente (retorna Model, padrão do projeto). `SendWhatsAppMessageJob` é job público (dispatch permitido). O módulo `WhatsApp` está `false` em `modules_statuses`, mas o job autoloada e o dispatch atual funciona — comportamento preservado.

**Alternativas**: Manter Observer no novo módulo — mantém o side-effect fora do fluxo EDA e continua acoplando via `wasChanged`/model events. Rejeitado por FR-019. Colocar telefone/mensagem no payload do evento — viola "IDs + snapshot mínimo" (telefone é PII). Rejeitado.

---

## R7 — Activity log: manter `ActivityLoggerInterface` (coupling aceito)

**Decisão**: `TreatmentPlanService` continua chamando `Modules\Clinic\Contracts\ActivityLoggerInterface` para registrar `ProgramCreated` (create), `ProgramCompleted` (update→completed) e `ExercisesAdded` (update com exercícios), exatamente como hoje. Registrar como **acoplamento temporário aceito** em ADR-010, com plano de remoção.

**Justificativa**: O feed de atividades do dashboard (`clinic.dashboard.activities`) depende dessas três atividades — o solicitante pediu explicitamente para não quebrar o dashboard. Manter o logging no Service preserva o feed byte-a-byte com risco mínimo. `ActivityLoggerInterface` é uma **ServiceInterface** (não Model/Repository), e seu consumo cross-module já é precedente no projeto (`Modules\Patient\Services\PatientService`). Não viola os fitness tests (a proibição é sobre Models de Admin/Patient/Media).

**Plano de remoção (ADR-010)**: no futuro, mover o logging para um listener no Clinic (`RecordTreatmentProgramActivity`, espelhando `RecordSchedulingActivity`) reagindo aos eventos de `TreatmentProgram`; isso exige um evento adicional para a granularidade `ExercisesAdded` (ex.: `TreatmentPlanExercisesUpdated`). Adiado para não expandir o escopo/risco desta extração.

**Alternativas**: (a) Mover logging para listener no Clinic agora — exige evento extra e arrisca a granularidade do feed; adiado. (b) Recriar `ActivityLogger` dentro de `TreatmentProgram` — duplicaria a capacidade de activity log (que é do Clinic) e gravaria na tabela `clinic_activities` (do Clinic) — pior acoplamento. Rejeitado.

---

## R8 — Mapeamento de eventos ↔ transições de status

**Decisão**: Não há endpoints dedicados de ativar/concluir/arquivar — o ciclo de vida ocorre pelo campo `status` em `create`/`update`. Mapear:

| Evento | Gatilho | Status resultante |
|--------|---------|-------------------|
| `TreatmentPlanCreated` | `create` (sempre) | qualquer (default `draft`) |
| `TreatmentPlanActivated` | `create` com `status=active` **ou** `update` que muda status → `active` | `active` |
| `TreatmentPlanCompleted` | `update` que muda status → `completed` | `completed` |
| `TreatmentPlanArchived` | `update` que muda status → `cancelled` | `cancelled` |

`cancelled` é o status de arquivamento/inativação existente (não há status `archived` nem SoftDeletes). "Arquivar" ⇒ `status=cancelled`.

**Justificativa**: Preserva o contrato REST (nenhum endpoint novo). O Service já compara `oldStatus` vs novo status no `update` (usado hoje para `ProgramCompleted`); estender para `active`/`cancelled` é simétrico.

**Alternativas**: Mapear `Archived` para `delete` (hard delete) — semântica diferente de arquivar; o delete não muda status. Rejeitado. Introduzir status `archived` — mudaria enum/validação e contrato. Rejeitado.

---

## R9 — Eventos de `ProgramDraft`

**Decisão**:
- `ProgramDraftCreated` / `ProgramDraftUpdated`: emitidos no `upsert` (`PUT /program-drafts`), conforme `updateOrCreate` tenha criado (`wasRecentlyCreated`) ou atualizado o rascunho.
- `ProgramDraftConvertedToTreatmentPlan`: emitido **best-effort** dentro de `TreatmentPlanService::create` quando o `clinic_user` ator possui um rascunho existente no momento da criação do plano (sinal de conversão do assistente). Não altera nenhuma response. Se não houver rascunho, não emite.

**Justificativa**: O backend não tem endpoint que crie plano e limpe rascunho atomicamente (o frontend faz `POST /treatment-plans` e depois `DELETE /program-drafts` como chamadas independentes). O gatilho best-effort no `create` dá ao evento um ponto de emissão real sem novo endpoint nem mudança de contrato. As classes dos 7 eventos são criadas conforme mandado.

**Alternativas**: Emitir `ProgramDraftConvertedToTreatmentPlan` no `DELETE /program-drafts` — ambíguo (descarte simples também deleta). Rejeitado. Deixar a classe sem gatilho — cumpre "criar evento" mas perde utilidade EDA. Preterido em favor do best-effort.

---

## R10 — Refactor de `ProgramDraftController` (FR-010)

**Decisão**: Introduzir `ProgramDraftServiceInterface`/`ProgramDraftService` e `ProgramDraftRepositoryInterface`/`ProgramDraftRepository`. O controller passa a: validar (Request/inline como hoje), delegar `show`/`upsert`/`destroy` ao Service (que usa o Repository e dispara eventos afterCommit). Mesmo request/response.

**Justificativa**: Hoje o controller faz query direta (`ClinicProgramDraft::where(...)`) — viola "Controller não pensa/consulta". FR-010 exige o padrão Service+Repository.

**Alternativas**: Manter query no controller — rejeitado por FR-010.

---

## R11 — Preservação de erros/404 e regras atuais

**Decisão**: Preservar exatamente: mensagens e status 404 (`'Plano de tratamento não encontrado.'`) por clínica; `store`→201, `update`→200, `duplicate`/`toModel`→201; `authorize('delete', $plan)` no destroy (Policy movida); `downloadPdf` renderizando `pdf.clinic.treatment.treatment-plan` (blade app-level, não movida) com `$plan` e mesmas relações. Manter `ProgramDraftController` retornando `data => draft_data|null` e mensagens atuais.

**Justificativa**: SC-001/003; nenhuma asserção HTTP/JSON pode ser relaxada.

---

## R12 — Seeders / Factories / migrate:fresh

**Decisão**: `git mv` de `TreatmentPlanSeeder.php` e das 5 migrations para o módulo. Ajustar namespaces. Se `DatabaseSeeder`/seeders do Clinic referenciam `TreatmentPlanSeeder` ou Models de plano, re-apontar imports para `Modules\TreatmentProgram`. Garantir `migrate:fresh --seed` verde. Criar/mover factories necessárias para os testes movidos.

**Justificativa**: FR-024, SC-005; sistema local/dev permite `migrate:fresh --seed`.

---

## R13 — Ordem das migrations e FKs

**Decisão**: Manter os timestamps/nomes dos arquivos de migration ao mover (`git mv` preserva o prefixo de data), garantindo que `clinic_treatment_plans` seja criado antes de groups/exercises/drafts e depois de `clinics`, `clinic_users`, `patients`, `admin_exercises`, `admin_physio_areas/subareas` (dependências de FK). O carregamento de migrations por módulo é agregado pelo Laravel por ordem de timestamp global, então a ordem relativa é preservada.

**Justificativa**: FKs para tabelas de Admin/Patient/Clinic exigem que essas migrations rodem antes. Os timestamps atuais (`2026_02_29_*`, `2026_03_25_*`, `2026_03_31_*`) já são posteriores às tabelas base. Mover sem renomear preserva a ordem.

**Alternativas**: Renomear migrations — risco de inverter ordem de FK. Rejeitado.

---

## R14 — Fitness tests (FR-027)

**Decisão**: Estender os testes de arquitetura existentes (`tests/Architecture/ModuleBoundaryTest`, `ExtractionReadinessTest`, `ClinicScopedModuleNamingTest`, fixtures) e criar `TreatmentProgramRouteCompatibilityTest`, cobrindo:
1. Controllers das rotas de prescrição ∈ `Modules\TreatmentProgram\Http\Controllers`.
2. Migrations `clinic_treatment_*` + `clinic_program_drafts` ∈ `modules/TreatmentProgram/database/migrations` e ausentes em `modules/Clinic/database/migrations`.
3. Rotas `clinic.treatment-plans.*`, `clinic.program-drafts.*`, `clinic.programs.*` existem com mesmo path/nome; não duplicadas no Clinic.
4. Código de produção de `TreatmentProgram` não importa `Modules\Admin\Models\Exercise`, `Modules\Admin\Models\AdminProgram`, `Modules\Patient\Models\Patient`, `Modules\Media\Models\*` (exceção FQN inline em Models documentada; a checagem mira Services/Repositories/Controllers).
5. Eventos de prescrição não carregam Model Eloquent (só tipos primitivos/imutáveis).
6. Controllers → `ServiceInterface`; Services → `RepositoryInterface`.

**Justificativa**: Mandado pelo enunciado; reaproveita a infra de fitness tests das extrações anteriores.

---

## R15 — Documentação de arquitetura

**Decisão**: Criar `docs/adr/010-treatment-program-extraction.md`; atualizar `docs/architecture/clinic-capability-map.md` (capability `treatment_program` → extracted) e `docs/architecture/extraction-readiness-checklist.md`. ADR registra ownership, paths/tabelas preservados, migrations no módulo dono, Clinic sem novas regras de prescrição, leituras de Patient/Admin/Media via ID/contrato/DTO/read model, e o acoplamento aceito de `ActivityLoggerInterface` (motivo + teste de contenção + plano de remoção).

**Justificativa**: Mandado; mantém a série de ADRs de extração coerente (006–011).
