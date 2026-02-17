<?php

namespace Modules\Clinic\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Clinic\Models\TreatmentPlan;

interface TreatmentPlanRepositoryInterface
{
    public function find(int $id): ?TreatmentPlan;

    public function findOrFail(int $id): TreatmentPlan;

    public function paginate(int $clinicId, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): TreatmentPlan;

    public function update(int $id, array $data): TreatmentPlan;

    public function delete(int $id): bool;
}
