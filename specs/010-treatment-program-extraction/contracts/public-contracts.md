# Public Contracts — novos contratos entre módulos

Três contratos públicos novos habilitam a extração sem imports de Model cross-module em regra de negócio.

## 1. Admin — `ExerciseCatalogReadServiceInterface` (NOVO)

`Modules\Admin\Contracts\Public\ExerciseCatalogReadServiceInterface`

```php
interface ExerciseCatalogReadServiceInterface
{
    /** Defaults de prescrição de um exercício do catálogo, ou null se inexistente. */
    public function findPrescriptionDefaults(int $exerciseId): ?ExercisePrescriptionDefaults;
}

// DTO readonly (Modules\Admin\Contracts\Public\ExercisePrescriptionDefaults)
final readonly class ExercisePrescriptionDefaults
{
    public function __construct(
        public int $exerciseId,
        public ?int $sets,
        public ?int $repetitions,
        public ?int $restTime,
    ) {}
}
```

**Consumidor**: `TreatmentPlanService::addExercise`. Substitui `Modules\Admin\Models\Exercise::findOrFail` (FR-014). Impl. `ExerciseCatalogReadService` no Admin lê `admin_exercises` (`sets`, `repetitions`, `rest_time`).

**Preservação**: quando `null` (exercício inexistente), o Service preserva o comportamento atual de erro (`findOrFail` lançava `ModelNotFoundException`).

## 2. Admin — `ProgramCatalogReadServiceInterface` (NOVO)

`Modules\Admin\Contracts\Public\ProgramCatalogReadServiceInterface`

```php
interface ProgramCatalogReadServiceInterface
{
    /** index de programas ativos: filtros search + physio_area_id; with(physioArea)+withCount(exercises); latest(). */
    public function paginate(array $filters, int $perPage): LengthAwarePaginator;

    /** show de programa ativo com detalhes; null → 404 no controller. */
    public function findActiveWithDetails(int $id): ?AdminProgram;
}
```

**Consumidor**: `SharedProgramController` (`clinic.programs.*`). Substitui leitura direta de `Modules\Admin\Models\AdminProgram` (FR-015). Impl. `ProgramCatalogReadService` no Admin.

**Preservação de shape**: o controller serializa o retorno como hoje — `index` retorna o paginador **direto** (`response()->json($paginator)`); `show` usa `{ data }` e `findOrFail`→404. O retorno de `AdminProgram`/paginator a partir de um contrato **do próprio Admin** é aceito (Model atravessa a fronteira serializado, padrão `PatientServiceInterface::find(): ?Patient`).

## 3. TreatmentProgram — `TreatmentProgramReadServiceInterface` (NOVO)

`Modules\TreatmentProgram\Contracts\Public\TreatmentProgramReadServiceInterface`

```php
interface TreatmentProgramReadServiceInterface
{
    /** Contagem de programas ativos para o dashboard da clínica. */
    public function activeProgramsCount(
        int $clinicId,
        ?int $clinicUserId,
        string $monthStart,
        string $monthEnd,
    ): int;
}
```

**Consumidor**: `Modules\Clinic\Repositories\DashboardRepository::activeProgramsCount`. Substitui a query direta em `Modules\Clinic\Models\TreatmentPlan` (FR-020). Impl. `TreatmentProgramReadService` no TreatmentProgram recebe strings `Y-m-d` e reproduz: `status = active`, `whereHas('patient', activeStatus)`, `start_date <= monthEnd`, `end_date null || >= monthStart`, filtro opcional por `clinic_user_id`.

**Precedente**: espelha `Modules\ClinicScheduling\Contracts\Public\SchedulingReadServiceInterface`, já consumido pelo `DashboardRepository` (ocupação/consultas de hoje).

---

## Nota de dependência aceita — `ActivityLoggerInterface`

`Modules\Clinic\Contracts\ActivityLoggerInterface` **não é** um contrato novo, mas é consumido cross-module por `TreatmentProgram` (precedente: `Modules\Patient`). Tratado como contrato compartilhado do Clinic. Registrado como acoplamento temporário aceito em [ADR-010](../../../docs/adr/010-treatment-program-extraction.md), com plano de remoção (migrar para listener no Clinic + evento de exercícios).
