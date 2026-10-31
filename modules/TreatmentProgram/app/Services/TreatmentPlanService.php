<?php

namespace Modules\TreatmentProgram\Services;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\Admin\Contracts\Public\ExerciseCatalogReadServiceInterface;
use Modules\Clinic\Contracts\ActivityLoggerInterface;
use Modules\Clinic\Enums\ActivityType;
use Modules\TreatmentProgram\Contracts\ProgramDraftRepositoryInterface;
use Modules\TreatmentProgram\Contracts\TreatmentPlanRepositoryInterface;
use Modules\TreatmentProgram\Contracts\TreatmentPlanServiceInterface;
use Modules\TreatmentProgram\Events\ProgramDraftConvertedToTreatmentPlan;
use Modules\TreatmentProgram\Events\TreatmentPlanActivated;
use Modules\TreatmentProgram\Events\TreatmentPlanArchived;
use Modules\TreatmentProgram\Events\TreatmentPlanCompleted;
use Modules\TreatmentProgram\Events\TreatmentPlanCreated;
use Modules\TreatmentProgram\Models\TreatmentPlan;

class TreatmentPlanService implements TreatmentPlanServiceInterface
{
    private const EVENT_VERSION = 1;

    /**
     * Campos que a edição de um exercício sobrescreve. Dias, período, carga,
     * notas e grupo vazios no payload ficam vazios no banco; séries,
     * repetições e descanso vazios recebem o padrão (`withDoseDefaults`): o do
     * catálogo ou, se o exercício saiu do catálogo, a dose atual da linha.
     */
    private const PRESCRIPTION_FIELDS = [
        'treatment_plan_group_id',
        'days_of_week',
        'period',
        'sets_min',
        'sets_max',
        'repetitions_min',
        'repetitions_max',
        'load_min',
        'load_max',
        'rest_time',
        'notes',
    ];

    public function __construct(
        protected TreatmentPlanRepositoryInterface $repository,
        protected ProgramDraftRepositoryInterface $programDraftRepository,
        protected ActivityLoggerInterface $activityLogger,
        protected ExerciseCatalogReadServiceInterface $exerciseCatalog,
    ) {}

    public function list(int $clinicId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->paginate($clinicId, $filters, $perPage);
    }

    public function find(int $id): TreatmentPlan
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): TreatmentPlan
    {
        $exercises = $data['exercises'] ?? [];
        $groups    = $data['groups'] ?? [];
        unset($data['exercises'], $data['groups']);
        $data['status'] ??= is_null($data['patient_id'] ?? null) ? TreatmentPlan::STATUS_DRAFT : TreatmentPlan::STATUS_ACTIVE;
        $this->ensureExercisesVisibleToClinic((int) $data['clinic_id'], $exercises);
        $this->ensureDoseRanges($exercises);

        $actorId = Auth::guard('clinic')->id();

        $plan = DB::transaction(function () use ($data, $exercises, $groups) {
            $plan     = $this->repository->create($data);
            $groupMap = [];
            if (!empty($groups)) {
                $groupMap = $this->syncGroups($plan, $groups);
            }
            foreach ($exercises as $exerciseData) {
                $groupIndex                              = $exerciseData['group_index'] ?? null;
                $exerciseData['treatment_plan_group_id'] = (!is_null($groupIndex) && isset($groupMap[$groupIndex])) ? $groupMap[$groupIndex] : null;
                unset($exerciseData['group_index']);
                $this->addExercise($plan, (int) $exerciseData['exercise_id'], $exerciseData);
            }

            return $plan->load(['groups.exercises.exercise', 'exercises.exercise', 'patient', 'physioArea', 'physioSubarea']);
        });

        $this->dispatchEvent(new TreatmentPlanCreated(...$this->createdPayload($plan, $actorId)));

        if ($plan->status === TreatmentPlan::STATUS_ACTIVE && !empty($plan->patient_id)) {
            $this->dispatchEvent(new TreatmentPlanActivated(...$this->activatedPayload($plan, $actorId)));
        }

        if (!is_null($actorId)) {
            $draft = $this->programDraftRepository->findByUser((int) $actorId);
            if (!is_null($draft)) {
                $this->dispatchEvent(new ProgramDraftConvertedToTreatmentPlan(
                    self::EVENT_VERSION,
                    (int) $draft->id,
                    (int) $plan->id,
                    (int) $plan->clinic_id,
                    (int) $actorId,
                    CarbonImmutable::now(),
                ));
            }
        }

        $this->activityLogger->log(
            $plan->clinic_id,
            ActivityType::ProgramCreated,
            "Programa criado — {$plan->title}",
            $plan,
        );

        return $plan;
    }

    public function update(int $id, array $data): TreatmentPlan
    {
        $exercises = $data['exercises'] ?? null;
        $groups    = $data['groups'] ?? null;
        unset($data['exercises'], $data['groups']);

        $current   = $this->repository->findOrFail($id);
        $oldStatus = $current->status;
        $actorId   = Auth::guard('clinic')->id();
        $this->ensureIdsBelongToPlan($current, $groups ?? [], $exercises ?? []);
        $this->ensureDoseRanges($exercises ?? []);
        $this->ensureExercisesVisibleToClinic(
            (int) $current->clinic_id,
            $exercises ?? [],
            $current->exercises()->pluck('exercise_id', 'id')->map(fn ($id) => (int) $id)->all(),
        );
        $data = $this->withStatusAfterEdit($current, $data);
        if ($this->patientChanges($current, $data)) {
            // O link público age como o paciente do plano: com outro paciente,
            // o link antigo não pode continuar abrindo o programa, e o que o
            // anterior viu e concluiu não passa para o novo (ADR 025).
            $data['public_token']            = (string) Str::uuid();
            $data['patient_viewed_at']       = null;
            $data['patient_completed_count'] = 0;
        }

        $plan = DB::transaction(function () use ($id, $data, $exercises, $groups) {
            $plan     = $this->repository->update($id, $data);
            $groupMap = [];
            if (!is_null($groups)) {
                $groupMap = $this->syncGroups($plan, $groups);
            }
            if (!is_null($exercises)) {
                $this->syncExercises($plan, $exercises, $groupMap);
            }

            return $plan->fresh(['groups.exercises.exercise', 'exercises.exercise', 'patient', 'physioArea', 'physioSubarea']);
        });

        if ($oldStatus !== TreatmentPlan::STATUS_ACTIVE
            && $plan->status === TreatmentPlan::STATUS_ACTIVE
            && !empty($plan->patient_id)) {
            $this->dispatchEvent(new TreatmentPlanActivated(...$this->activatedPayload($plan, $actorId)));
        }

        if ($oldStatus !== TreatmentPlan::STATUS_COMPLETED && $plan->status === TreatmentPlan::STATUS_COMPLETED) {
            if (!empty($plan->patient_id)) {
                $this->dispatchEvent(new TreatmentPlanCompleted(...$this->completedPayload($plan, $actorId)));
            }

            $this->activityLogger->log(
                $plan->clinic_id,
                ActivityType::ProgramCompleted,
                "Programa concluído — {$plan->title}",
                $plan,
            );
        }

        if ($oldStatus !== TreatmentPlan::STATUS_CANCELLED && $plan->status === TreatmentPlan::STATUS_CANCELLED) {
            $this->dispatchEvent(new TreatmentPlanArchived(...$this->archivedPayload($plan, $actorId)));
        }

        if (!is_null($exercises) && count($exercises) > 0) {
            $this->activityLogger->log(
                $plan->clinic_id,
                ActivityType::ExercisesAdded,
                count($exercises) . ' exercício(s) adicionado(s) — ' . $plan->title,
                $plan,
            );
        }

        return $plan;
    }

    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }

    public function addExercise(TreatmentPlan $plan, int $exerciseId, array $overrides = []): void
    {
        $data = $this->withDoseDefaults(
            array_merge(
                ['treatment_plan_id' => $plan->id, 'sort_order' => $plan->exercises()->count()],
                array_filter($overrides, fn ($v) => !is_null($v)),
            ),
            $this->catalogDefaults($exerciseId),
        );
        $data['exercise_id'] = $exerciseId;
        $plan->exercises()->create($data);
    }

    /**
     * Séries, repetições e descanso do catálogo: o que o exercício recebe
     * quando a clínica não define a dose.
     */
    private function catalogDefaults(int $exerciseId): array
    {
        $defaults = $this->catalogDefaultsOrNull($exerciseId);
        if (is_null($defaults)) {
            throw new ModelNotFoundException("Exercise {$exerciseId} not found in catalog.");
        }

        return $defaults;
    }

    /** Como `catalogDefaults`, mas null quando o exercício saiu do catálogo. */
    private function catalogDefaultsOrNull(int $exerciseId): ?array
    {
        $exercise = $this->exerciseCatalog->findPrescriptionDefaults($exerciseId);
        if (is_null($exercise)) {
            return null;
        }

        return [
            'exercise_id'     => $exerciseId,
            'sets_min'        => $exercise->sets,
            'sets_max'        => $exercise->sets,
            'repetitions_min' => $exercise->repetitions,
            'repetitions_max' => $exercise->repetitions,
            'rest_time'       => $exercise->restTime ? (string) $exercise->restTime : null,
        ];
    }

    /**
     * Completa a dose com o padrão por par (ADR 025): mínimo e máximo vazios
     * recebem o padrão; só um dos dois vazio copia o outro (o atalho "3 × 12"
     * manda só o mínimo, e o máximo do catálogo podia ficar abaixo dele).
     * Descanso vazio recebe o padrão.
     */
    private function withDoseDefaults(array $data, array $defaults): array
    {
        foreach ([['sets_min', 'sets_max'], ['repetitions_min', 'repetitions_max']] as [$min, $max]) {
            $low  = $data[$min] ?? null;
            $high = $data[$max] ?? null;
            if (is_null($low) && is_null($high)) {
                $data[$min] = $defaults[$min] ?? null;
                $data[$max] = $defaults[$max] ?? null;
            } elseif (is_null($low)) {
                $data[$min] = $high;
            } elseif (is_null($high)) {
                $data[$max] = $low;
            }
        }
        $data['rest_time'] ??= $defaults['rest_time'] ?? null;

        return $data;
    }

    /** Mínimo acima do máximo (séries, repetições ou carga) responde 422. */
    private function ensureDoseRanges(array $exercises): void
    {
        $errors = [];
        foreach ($exercises as $index => $exercise) {
            foreach (['sets', 'repetitions', 'load'] as $field) {
                $low  = $exercise["{$field}_min"] ?? null;
                $high = $exercise["{$field}_max"] ?? null;
                if (!is_null($low) && !is_null($high) && $low > $high) {
                    $errors["exercises.{$index}.{$field}_max"] = 'O máximo não pode ser menor que o mínimo.';
                }
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    /**
     * Sem status no payload, a edição muda a situação assim (ADR 025): sem
     * paciente, vira rascunho; rascunho salvo com paciente é enviado (ativo),
     * porque o assistente mostra o link na hora e o link público não abre
     * rascunho. Ativo, concluído e cancelado (arquivado) ficam como estão.
     */
    private function withStatusAfterEdit(TreatmentPlan $current, array $data): array
    {
        if (!empty($data['status'])) {
            return $data;
        }
        unset($data['status']);
        if (!array_key_exists('patient_id', $data)) {
            return $data;
        }

        if (is_null($data['patient_id'])) {
            $data['status'] = TreatmentPlan::STATUS_DRAFT;
        } elseif ($current->status === TreatmentPlan::STATUS_DRAFT) {
            $data['status'] = TreatmentPlan::STATUS_ACTIVE;
        }

        return $data;
    }

    /**
     * Só entra no programa o exercício que a clínica enxerga na biblioteca.
     * Na edição, o que já estava no programa (mesmo id e mesmo exercício)
     * continua aceito, mesmo que tenha deixado de ser visível.
     *
     * @param  array<int, int>  $alreadyInPlan  id do exercício do programa → id do catálogo
     */
    private function ensureExercisesVisibleToClinic(int $clinicId, array $exercises, array $alreadyInPlan = []): void
    {
        $toCheck = [];
        foreach ($exercises as $index => $exercise) {
            $catalogId = (int) $exercise['exercise_id'];
            $id        = isset($exercise['id']) ? (int) $exercise['id'] : null;
            if (!is_null($id) && ($alreadyInPlan[$id] ?? null) === $catalogId) {
                continue;
            }
            $toCheck[$index] = $catalogId;
        }

        $visible = $this->exerciseCatalog->visibleToClinic(array_values(array_unique($toCheck)), $clinicId);
        $errors  = [];
        foreach ($toCheck as $index => $catalogId) {
            if (!in_array($catalogId, $visible, true)) {
                $errors["exercises.{$index}.exercise_id"] = 'Exercício não encontrado na biblioteca da clínica.';
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function patientChanges(TreatmentPlan $current, array $data): bool
    {
        if (!array_key_exists('patient_id', $data)) {
            return false;
        }
        $next = is_null($data['patient_id']) ? null : (int) $data['patient_id'];
        $now  = is_null($current->patient_id) ? null : (int) $current->patient_id;

        return $next !== $now;
    }

    /**
     * Grupo ou exercício com id precisa ser deste programa, e o exercício não
     * pode trocar de vídeo do catálogo mantendo o id (as séries seriam de
     * outro exercício).
     */
    private function ensureIdsBelongToPlan(TreatmentPlan $plan, array $groups, array $exercises): void
    {
        $errors   = [];
        $groupIds = $plan->groups()->pluck('id')->all();
        foreach ($groups as $index => $group) {
            if (isset($group['id']) && !in_array((int) $group['id'], $groupIds, true)) {
                $errors["groups.{$index}.id"] = 'Grupo não pertence a este programa.';
            }
        }

        $catalogIdOf = $plan->exercises()->pluck('exercise_id', 'id')->all();
        $seen        = [];
        foreach ($exercises as $index => $exercise) {
            if (!isset($exercise['id'])) {
                continue;
            }
            $id = (int) $exercise['id'];
            if (isset($seen[$id])) {
                $errors["exercises.{$index}.id"] = 'Exercício repetido no programa.';
            } elseif (!array_key_exists($id, $catalogIdOf)) {
                $errors["exercises.{$index}.id"] = 'Exercício não pertence a este programa.';
            } elseif ((int) $catalogIdOf[$id] !== (int) $exercise['exercise_id']) {
                $errors["exercises.{$index}.id"] = 'Para trocar o exercício, remova-o e adicione o novo.';
            }
            $seen[$id] = true;
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    /**
     * Sincroniza os exercícios pelo id (ADR 025): com id, atualiza no lugar e
     * mantém as séries que o paciente registrou; sem id, cria; o que não veio
     * é apagado. A ordem é o `sort_order` enviado ou, sem ele, a posição no
     * payload.
     */
    private function syncExercises(TreatmentPlan $plan, array $exercises, array $groupMap): void
    {
        $existing = $plan->exercises()->get()->keyBy('id');
        $keptIds  = array_values(array_filter(array_map(
            fn (array $e) => isset($e['id']) ? (int) $e['id'] : null,
            $exercises,
        )));

        $plan->exercises()->whereNotIn('id', $keptIds)->delete();

        foreach ($exercises as $index => $exerciseData) {
            $groupIndex = $exerciseData['group_index'] ?? null;
            $id         = isset($exerciseData['id']) ? (int) $exerciseData['id'] : null;
            unset($exerciseData['group_index'], $exerciseData['id']);
            $exerciseData['treatment_plan_group_id'] = (!is_null($groupIndex) && isset($groupMap[$groupIndex])) ? $groupMap[$groupIndex] : null;
            $exerciseData['sort_order'] ??= $index;

            if (is_null($id)) {
                $this->addExercise($plan, (int) $exerciseData['exercise_id'], $exerciseData);

                continue;
            }

            // Exercício que saiu do catálogo continua editável: a dose atual
            // da linha faz o papel do padrão (ADR 025).
            $row = $existing[$id];
            $row->update($this->withDoseDefaults(
                array_merge(
                    array_fill_keys(self::PRESCRIPTION_FIELDS, null),
                    array_filter($exerciseData, fn ($v) => !is_null($v)),
                ),
                $this->catalogDefaultsOrNull((int) $exerciseData['exercise_id'])
                    ?? $row->only(['sets_min', 'sets_max', 'repetitions_min', 'repetitions_max', 'rest_time']),
            ));
        }
    }

    public function removeExercise(TreatmentPlan $plan, int $exerciseId): void
    {
        $plan->exercises()->where('exercise_id', $exerciseId)->delete();
    }

    /**
     * Sincroniza os grupos pelo id (ADR 025) e devolve posição no payload → id
     * do grupo, para os exercícios acharem o seu.
     */
    public function syncGroups(TreatmentPlan $plan, array $groups): array
    {
        $existing = $plan->groups()->get()->keyBy('id');
        $keptIds  = array_values(array_filter(array_map(
            fn (array $g) => isset($g['id']) ? (int) $g['id'] : null,
            $groups,
        )));

        $plan->groups()->whereNotIn('id', $keptIds)->delete();

        $groupMap = [];
        foreach ($groups as $index => $group) {
            $attributes = [
                'name'       => $group['name'],
                'sort_order' => $group['sort_order'] ?? $index,
            ];
            if (isset($group['id'])) {
                $existing[(int) $group['id']]->update($attributes);
                $groupMap[$index] = (int) $group['id'];

                continue;
            }
            $groupMap[$index] = $plan->groups()->create($attributes)->id;
        }

        return $groupMap;
    }

    public function duplicate(int $id): TreatmentPlan
    {
        $original = $this->repository->findOrFail($id);
        $original->load(['groups', 'exercises']);

        return DB::transaction(function () use ($original) {
            $newPlan = $this->repository->create([
                'clinic_id'         => $original->clinic_id,
                'patient_id'        => null,
                'title'             => $original->title . ' (cópia)',
                'message'           => $original->message,
                'physio_area_id'    => $original->physio_area_id,
                'physio_subarea_id' => $original->physio_subarea_id,
                'duration_minutes'  => $original->duration_minutes,
                'status'            => TreatmentPlan::STATUS_DRAFT,
                'notes'             => $original->notes,
            ]);
            $groupMap = [];
            foreach ($original->groups as $group) {
                $newGroup             = $newPlan->groups()->create(['name' => $group->name, 'sort_order' => $group->sort_order]);
                $groupMap[$group->id] = $newGroup->id;
            }
            foreach ($original->exercises as $ex) {
                $newPlan->exercises()->create([
                    'treatment_plan_group_id' => isset($groupMap[$ex->treatment_plan_group_id]) ? $groupMap[$ex->treatment_plan_group_id] : null,
                    'exercise_id'             => $ex->exercise_id,
                    'days_of_week'            => $ex->days_of_week,
                    'period'                  => $ex->period,
                    'sets_min'                => $ex->sets_min,
                    'sets_max'                => $ex->sets_max,
                    'repetitions_min'         => $ex->repetitions_min,
                    'repetitions_max'         => $ex->repetitions_max,
                    'load_min'                => $ex->load_min,
                    'load_max'                => $ex->load_max,
                    'rest_time'               => $ex->rest_time,
                    'notes'                   => $ex->notes,
                    'sort_order'              => $ex->sort_order,
                ]);
            }

            return $newPlan->load(['groups.exercises.exercise', 'exercises.exercise', 'patient', 'physioArea', 'physioSubarea']);
        });
    }

    public function toModel(int $id): TreatmentPlan
    {
        $original = $this->repository->findOrFail($id);
        $original->load(['groups', 'exercises']);

        return DB::transaction(function () use ($original) {
            $newPlan = $this->repository->create([
                'clinic_id'         => $original->clinic_id,
                'clinic_user_id'    => $original->clinic_user_id,
                'patient_id'        => null,
                'title'             => $original->title,
                'message'           => $original->message,
                'physio_area_id'    => $original->physio_area_id,
                'physio_subarea_id' => $original->physio_subarea_id,
                'duration_minutes'  => $original->duration_minutes,
                'status'            => TreatmentPlan::STATUS_DRAFT,
                'notes'             => $original->notes,
            ]);
            $groupMap = [];
            foreach ($original->groups as $group) {
                $newGroup             = $newPlan->groups()->create(['name' => $group->name, 'sort_order' => $group->sort_order]);
                $groupMap[$group->id] = $newGroup->id;
            }
            foreach ($original->exercises as $ex) {
                $newPlan->exercises()->create([
                    'treatment_plan_group_id' => isset($groupMap[$ex->treatment_plan_group_id]) ? $groupMap[$ex->treatment_plan_group_id] : null,
                    'exercise_id'             => $ex->exercise_id,
                    'days_of_week'            => $ex->days_of_week,
                    'period'                  => $ex->period,
                    'sets_min'                => $ex->sets_min,
                    'sets_max'                => $ex->sets_max,
                    'repetitions_min'         => $ex->repetitions_min,
                    'repetitions_max'         => $ex->repetitions_max,
                    'load_min'                => $ex->load_min,
                    'load_max'                => $ex->load_max,
                    'rest_time'               => $ex->rest_time,
                    'notes'                   => $ex->notes,
                    'sort_order'              => $ex->sort_order,
                ]);
            }

            return $newPlan->load(['groups.exercises.exercise', 'exercises.exercise', 'patient', 'physioArea', 'physioSubarea']);
        });
    }

    /**
     * @return array{int,int,int,?int,?int,?int,string,CarbonImmutable}
     */
    private function createdPayload(TreatmentPlan $plan, ?int $actorId): array
    {
        return [
            self::EVENT_VERSION,
            (int) $plan->id,
            (int) $plan->clinic_id,
            !is_null($plan->patient_id) ? (int) $plan->patient_id : null,
            !is_null($plan->clinic_user_id) ? (int) $plan->clinic_user_id : null,
            $actorId,
            (string) $plan->status,
            CarbonImmutable::now(),
        ];
    }

    /**
     * @return array{int,int,int,int,?int,?int,string,?string,CarbonImmutable}
     */
    private function activatedPayload(TreatmentPlan $plan, ?int $actorId): array
    {
        return [
            self::EVENT_VERSION,
            (int) $plan->id,
            (int) $plan->clinic_id,
            (int) $plan->patient_id,
            !is_null($plan->clinic_user_id) ? (int) $plan->clinic_user_id : null,
            $actorId,
            (string) $plan->status,
            $plan->start_date?->toDateString() ?? now()->toDateString(),
            CarbonImmutable::now(),
        ];
    }

    /**
     * @return array{int,int,int,int,?int,?int,string,?string,CarbonImmutable}
     */
    private function completedPayload(TreatmentPlan $plan, ?int $actorId): array
    {
        return [
            self::EVENT_VERSION,
            (int) $plan->id,
            (int) $plan->clinic_id,
            (int) $plan->patient_id,
            !is_null($plan->clinic_user_id) ? (int) $plan->clinic_user_id : null,
            $actorId,
            (string) $plan->status,
            $plan->end_date?->toDateString() ?? now()->toDateString(),
            CarbonImmutable::now(),
        ];
    }

    /**
     * @return array{int,int,int,?int,?int,?int,string,CarbonImmutable}
     */
    private function archivedPayload(TreatmentPlan $plan, ?int $actorId): array
    {
        return [
            self::EVENT_VERSION,
            (int) $plan->id,
            (int) $plan->clinic_id,
            !is_null($plan->patient_id) ? (int) $plan->patient_id : null,
            !is_null($plan->clinic_user_id) ? (int) $plan->clinic_user_id : null,
            $actorId,
            (string) $plan->status,
            CarbonImmutable::now(),
        ];
    }

    private function dispatchEvent(object $event): void
    {
        DB::afterCommit(fn () => Event::dispatch($event));
    }
}
