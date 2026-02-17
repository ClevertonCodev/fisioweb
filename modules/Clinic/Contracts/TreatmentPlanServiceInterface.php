<?php

namespace Modules\Clinic\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Clinic\Models\TreatmentPlan;

interface TreatmentPlanServiceInterface
{
    public function list(int $clinicId, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function find(int $id): TreatmentPlan;

    public function create(array $data): TreatmentPlan;

    public function update(int $id, array $data): TreatmentPlan;

    public function delete(int $id): bool;

    public function addExercise(TreatmentPlan $plan, int $exerciseId, array $overrides = []): void;

    public function removeExercise(TreatmentPlan $plan, int $exerciseId): void;

    public function syncGroups(TreatmentPlan $plan, array $groups): void;

    public function duplicate(int $id): TreatmentPlan;
}
