<?php

namespace Modules\Clinic\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Clinic\Contracts\TreatmentPlanRepositoryInterface;
use Modules\Clinic\Models\TreatmentPlan;

class TreatmentPlanRepository implements TreatmentPlanRepositoryInterface
{
    public function __construct(
        protected TreatmentPlan $model,
    ) {}

    public function find(int $id): ?TreatmentPlan
    {
        return $this->model->find($id);
    }

    public function findOrFail(int $id): TreatmentPlan
    {
        return $this->model->findOrFail($id);
    }

    public function paginate(int $clinicId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model
            ->with(['patient', 'clinicUser', 'physioArea', 'exercises'])
            ->forClinic($clinicId);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['patient_id'])) {
            $query->where('patient_id', $filters['patient_id']);
        }

        if (!empty($filters['physio_area_id'])) {
            $query->where('physio_area_id', $filters['physio_area_id']);
        }

        if (!empty($filters['clinic_user_id'])) {
            $query->where('clinic_user_id', $filters['clinic_user_id']);
        }

        return $query->latest()->paginate($perPage)->withQueryString();
    }

    public function create(array $data): TreatmentPlan
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): TreatmentPlan
    {
        $plan = $this->findOrFail($id);
        $plan->update($data);

        return $plan->fresh();
    }

    public function delete(int $id): bool
    {
        return (bool) $this->findOrFail($id)->delete();
    }
}
