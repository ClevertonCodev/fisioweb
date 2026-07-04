<?php

namespace Modules\TreatmentProgram\Services;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
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

        $oldStatus = $this->repository->findOrFail($id)->status;
        $actorId   = Auth::guard('clinic')->id();

        $plan = DB::transaction(function () use ($id, $data, $exercises, $groups) {
            $plan     = $this->repository->update($id, $data);
            $groupMap = [];
            if (!is_null($groups)) {
                $groupMap = $this->syncGroups($plan, $groups);
            }
            if (!is_null($exercises)) {
                $plan->exercises()->delete();
                foreach ($exercises as $exerciseData) {
                    $groupIndex                              = $exerciseData['group_index'] ?? null;
                    $exerciseData['treatment_plan_group_id'] = (!is_null($groupIndex) && isset($groupMap[$groupIndex])) ? $groupMap[$groupIndex] : null;
                    unset($exerciseData['group_index']);
                    $this->addExercise($plan, (int) $exerciseData['exercise_id'], $exerciseData);
                }
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
        $exercise = $this->exerciseCatalog->findPrescriptionDefaults($exerciseId);
        if (is_null($exercise)) {
            throw new ModelNotFoundException("Exercise {$exerciseId} not found in catalog.");
        }
        $defaults = [
            'treatment_plan_id' => $plan->id,
            'exercise_id'       => $exerciseId,
            'sets_min'          => $exercise->sets,
            'sets_max'          => $exercise->sets,
            'repetitions_min'   => $exercise->repetitions,
            'repetitions_max'   => $exercise->repetitions,
            'rest_time'         => $exercise->restTime ? (string) $exercise->restTime : null,
            'sort_order'        => $plan->exercises()->count(),
        ];
        $data                = array_merge($defaults, array_filter($overrides, fn ($v) => !is_null($v)));
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
