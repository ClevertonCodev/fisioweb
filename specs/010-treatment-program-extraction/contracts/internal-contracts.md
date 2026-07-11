# Internal Contracts — TreatmentProgram (privados do módulo)

Interfaces internas do módulo. Controllers dependem de `*ServiceInterface`; Services dependem de `*RepositoryInterface`. Bindings no `TreatmentProgramServiceProvider`.

## TreatmentPlanServiceInterface (git mv de Clinic)

```php
namespace Modules\TreatmentProgram\Contracts;

interface TreatmentPlanServiceInterface
{
    public function list(int $clinicId, array $filters = [], int $perPage = 15): LengthAwarePaginator;
    public function find(int $id): TreatmentPlan;
    public function create(array $data): TreatmentPlan;      // + eventos Created/Activated (+ Converted best-effort)
    public function update(int $id, array $data): TreatmentPlan; // + eventos Activated/Completed/Archived
    public function delete(int $id): bool;
    public function duplicate(int $id): TreatmentPlan;
    public function toModel(int $id): TreatmentPlan;
    public function addExercise(TreatmentPlan $plan, int $exerciseId, array $overrides = []): void; // usa ExerciseCatalogReadServiceInterface
    public function removeExercise(TreatmentPlan $plan, int $exerciseId): void;
    public function syncGroups(TreatmentPlan $plan, array $groups): array;
}
```

**Mudanças na extração** (comportamento preservado):
- `addExercise` deixa de usar `Modules\Admin\Models\Exercise`; usa `ExerciseCatalogReadServiceInterface::findPrescriptionDefaults($exerciseId)` para `sets/repetitions/rest_time`.
- Eventos disparados via `DB::afterCommit` após cada transação de escrita.
- Activity log (`ProgramCreated`/`Completed`/`ExercisesAdded`) mantido via `ActivityLoggerInterface` (coupling aceito, ADR-010).

## TreatmentPlanRepositoryInterface (git mv de Clinic)

```php
interface TreatmentPlanRepositoryInterface
{
    public function paginate(int $clinicId, array $filters, int $perPage): LengthAwarePaginator;
    public function findOrFail(int $id): TreatmentPlan;
    public function create(array $data): TreatmentPlan;
    public function update(int $id, array $data): TreatmentPlan;
    public function delete(int $id): bool;
    // toda query complexa (filtros/joins) reside aqui
}
```

## ProgramDraftServiceInterface (NOVO — refactor do controller gordo)

```php
interface ProgramDraftServiceInterface
{
    public function showForUser(int $clinicUserId): ?array;           // draft_data | null
    public function upsertForUser(int $clinicId, int $clinicUserId, array $draftData): void; // + ProgramDraftCreated|Updated
    public function destroyForUser(int $clinicUserId): void;
}
```

## ProgramDraftRepositoryInterface (NOVO)

```php
interface ProgramDraftRepositoryInterface
{
    public function findByUser(int $clinicUserId): ?ClinicProgramDraft;
    public function upsert(int $clinicId, int $clinicUserId, array $draftData): array; // [ClinicProgramDraft, bool $wasCreated]
    public function deleteByUser(int $clinicUserId): void;
    public function existsForUser(int $clinicUserId): bool; // usado no best-effort de conversão
}
```

## Policy

`TreatmentPlanPolicy` (git mv): `viewAny`, `view`, `create`, `update`, `delete`, `duplicate` — ownership por `clinic_id` preservado. Registrada via `Gate::policy(TreatmentPlan::class, TreatmentPlanPolicy::class)` no provider do TreatmentProgram.

## Injeções cross-module (contratos externos consumidos)

| Consumidor | Contrato | Módulo | Uso |
|-----------|----------|--------|-----|
| `TreatmentPlanService` | `ExerciseCatalogReadServiceInterface` | Admin | defaults de prescrição |
| `TreatmentPlanService` | `ActivityLoggerInterface` | Clinic (aceito) | activity feed |
| `SharedProgramController` | `ProgramCatalogReadServiceInterface` | Admin | endpoints `programs` |
| `SendTreatmentPlanActivationNotification` | `PatientServiceInterface` | Patient | telefone/clinic do paciente |
| `SendTreatmentPlanActivationNotification` | `SendWhatsAppMessageJob` | WhatsApp | dispatch da notificação |
| `TreatmentPlanController` | `PdfService` | Pdf | download PDF |
