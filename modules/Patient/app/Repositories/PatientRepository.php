<?php

namespace Modules\Patient\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Patient\Contracts\PatientRepositoryInterface;
use Modules\Patient\Models\Patient;

class PatientRepository implements PatientRepositoryInterface
{
    public function find(int $id): ?Patient
    {
        return Patient::with('clinicUser:id,name')->find($id);
    }

    public function findOrFail(int $id): Patient
    {
        return Patient::findOrFail($id);
    }

    public function paginateByClinic(int $clinicId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Patient::where('clinic_id', $clinicId)
            ->with('clinicUser:id,name');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('cpf', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null) {
            $query->where('is_active', $filters['is_active']);
        }

        if (!empty($filters['statuses'])) {
            $query->whereIn('status', $filters['statuses']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['professional_ids'])) {
            $query->whereIn('clinic_user_id', $filters['professional_ids']);
        }

        $page = $filters['page'] ?? null;

        return $query
            ->orderBy('created_at', 'desc')
            ->orderBy('name', 'asc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function bulkInactivate(int $clinicId, array $ids): int
    {
        return Patient::where('clinic_id', $clinicId)
            ->whereIn('id', $ids)
            ->update(['is_active' => false]);
    }

    public function create(array $data): Patient
    {
        return Patient::create($data);
    }

    public function update(int $id, array $data): Patient
    {
        $patient = $this->findOrFail($id);
        $patient->update($data);

        return $patient->fresh();
    }
}
