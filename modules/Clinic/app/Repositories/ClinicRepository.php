<?php

namespace Modules\Clinic\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Clinic\Contracts\ClinicRepositoryInterface;
use Modules\Clinic\Models\Clinic;

class ClinicRepository implements ClinicRepositoryInterface
{
    public function __construct(protected Clinic $model) {}

    public function find(int $id): ?Clinic
    {
        return $this->model->find($id);
    }

    public function findOrFail(int $id): Clinic
    {
        return $this->model->with('plan')->findOrFail($id);
    }

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (isset($filters['plan_id'])) {
            $query->where('plan_id', $filters['plan_id']);
        }

        if (array_key_exists('status', $filters)) {
            $query->where('status', (int) $filters['status']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (isset($filters['search']) && $filters['search'] !== '') {
            $search       = $filters['search'];
            $searchDigits = preg_replace('/[^\d]+/', '', $search);
            $query->where(function ($q) use ($search, $searchDigits) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('crefito', 'like', "%{$search}%");
                if ($searchDigits !== '') {
                    $q->orWhere('document', 'like', "%{$searchDigits}%");
                }
            });
        }

        return $query->with('plan')->latest()->paginate($perPage);
    }

    public function create(array $data): Clinic
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): Clinic
    {
        $clinic = $this->model->findOrFail($id);
        $clinic->update($data);

        return $clinic->fresh(['plan']);
    }

    public function delete(int $id): bool
    {
        return (bool) $this->model->findOrFail($id)->delete();
    }
}
