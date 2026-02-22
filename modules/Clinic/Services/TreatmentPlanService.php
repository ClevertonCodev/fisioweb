<?php

namespace Modules\Clinic\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Modules\Admin\Models\Exercise;
use Modules\Clinic\Contracts\TreatmentPlanRepositoryInterface;
use Modules\Clinic\Contracts\TreatmentPlanServiceInterface;
use Modules\Clinic\Models\TreatmentPlan;

class TreatmentPlanService implements TreatmentPlanServiceInterface
{
    public function __construct(
        protected TreatmentPlanRepositoryInterface $repository,
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

        return DB::transaction(function () use ($data, $exercises, $groups) {
            $plan = $this->repository->create($data);

            $groupMap = [];
            if (!empty($groups)) {
                $groupMap = $this->syncGroups($plan, $groups);
            }

            foreach ($exercises as $exerciseData) {
                $groupIndex                              = $exerciseData['group_index'] ?? null;
                $exerciseData['treatment_plan_group_id'] = ($groupIndex !== null && isset($groupMap[$groupIndex]))
                    ? $groupMap[$groupIndex]
                    : null;
                unset($exerciseData['group_index']);

                $this->addExercise($plan, $exerciseData['exercise_id'], $exerciseData);
            }

            return $plan->load(['groups.exercises.exercise', 'exercises.exercise', 'patient', 'clinicUser']);
        });
    }

    public function update(int $id, array $data): TreatmentPlan
    {
        $exercises = $data['exercises'] ?? null;
        $groups    = $data['groups'] ?? null;
        unset($data['exercises'], $data['groups']);

        return DB::transaction(function () use ($id, $data, $exercises, $groups) {
            $plan = $this->repository->update($id, $data);

            $groupMap = [];
            if ($groups !== null) {
                $groupMap = $this->syncGroups($plan, $groups);
            }

            if ($exercises !== null) {
                $plan->exercises()->delete();

                foreach ($exercises as $exerciseData) {
                    $groupIndex                              = $exerciseData['group_index'] ?? null;
                    $exerciseData['treatment_plan_group_id'] = ($groupIndex !== null && isset($groupMap[$groupIndex]))
                        ? $groupMap[$groupIndex]
                        : null;
                    unset($exerciseData['group_index']);

                    $this->addExercise($plan, $exerciseData['exercise_id'], $exerciseData);
                }
            }

            return $plan->fresh(['groups.exercises.exercise', 'exercises.exercise', 'patient', 'clinicUser']);
        });
    }

    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }

    /**
     * Adiciona exercício ao plano copiando valores padrão do exercício.
     */
    public function addExercise(TreatmentPlan $plan, int $exerciseId, array $overrides = []): void
    {
        $exercise = Exercise::findOrFail($exerciseId);

        $defaults = [
            'treatment_plan_id'       => $plan->id,
            'exercise_id'             => $exerciseId,
            'sets_min'                => $exercise->sets,
            'sets_max'                => $exercise->sets,
            'repetitions_min'         => $exercise->repetitions,
            'repetitions_max'         => $exercise->repetitions,
            'rest_time'               => $exercise->rest_time ? (string) $exercise->rest_time : null,
            'sort_order'              => $plan->exercises()->count(),
        ];

        $data = array_merge($defaults, array_filter($overrides, fn ($v) => $v !== null));
        unset($data['exercise_id']);
        $data['exercise_id'] = $exerciseId;

        $plan->exercises()->create($data);
    }

    public function removeExercise(TreatmentPlan $plan, int $exerciseId): void
    {
        $plan->exercises()->where('exercise_id', $exerciseId)->delete();
    }

    public function syncGroups(TreatmentPlan $plan, array $groups): array
    {
        $plan->groups()->delete();

        $groupMap = [];
        foreach ($groups as $index => $group) {
            $created = $plan->groups()->create([
                'name'       => $group['name'],
                'sort_order' => $group['sort_order'] ?? $index,
            ]);
            $groupMap[$index] = $created->id;
        }

        return $groupMap;
    }

    /**
     * Duplica um plano de tratamento (como template).
     */
    public function duplicate(int $id): TreatmentPlan
    {
        $original = $this->repository->findOrFail($id);
        $original->load(['groups', 'exercises']);

        return DB::transaction(function () use ($original) {
            $newPlan = $this->repository->create([
                'clinic_id'         => $original->clinic_id,
                'patient_id'        => null,
                'clinic_user_id'    => $original->clinic_user_id,
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
                $newGroup = $newPlan->groups()->create([
                    'name'       => $group->name,
                    'sort_order' => $group->sort_order,
                ]);
                $groupMap[$group->id] = $newGroup->id;
            }

            foreach ($original->exercises as $exercise) {
                $newPlan->exercises()->create([
                    'treatment_plan_group_id' => isset($exercise->treatment_plan_group_id)
                        ? ($groupMap[$exercise->treatment_plan_group_id] ?? null)
                        : null,
                    'exercise_id'      => $exercise->exercise_id,
                    'days_of_week'     => $exercise->days_of_week,
                    'period'           => $exercise->period,
                    'sets_min'         => $exercise->sets_min,
                    'sets_max'         => $exercise->sets_max,
                    'repetitions_min'  => $exercise->repetitions_min,
                    'repetitions_max'  => $exercise->repetitions_max,
                    'load_min'         => $exercise->load_min,
                    'load_max'         => $exercise->load_max,
                    'rest_time'        => $exercise->rest_time,
                    'notes'            => $exercise->notes,
                    'sort_order'       => $exercise->sort_order,
                ]);
            }

            return $newPlan->load(['groups.exercises.exercise', 'exercises.exercise']);
        });
    }
}
