<?php

namespace Modules\Patient\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Patient\Contracts\PatientRepositoryInterface;
use Modules\Patient\Models\Patient;

class PatientRepository implements PatientRepositoryInterface
{
    public function find(int $id): ?Patient
    {
        return Patient::find($id);
    }

    public function findOrFail(int $id): Patient
    {
        return Patient::findOrFail($id);
    }

    public function findByEmailOrCpf(string $identifier): ?Patient
    {
        return Patient::where('email', $identifier)
            ->orWhere('cpf', $identifier)
            ->first();
    }

    public function paginateByClinic(int $clinicId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return Patient::whereHas('clinics', fn ($q) => $q->where('clinics.id', $clinicId))
            ->with(['clinics' => fn ($q) => $q->where('clinics.id', $clinicId)->withPivot('registered_by')])
            ->when(
                isset($filters['search']) && $filters['search'],
                fn ($q) => $q->where(function ($q) use ($filters) {
                    $q->where('name', 'like', "%{$filters['search']}%")
                        ->orWhere('cpf', 'like', "%{$filters['search']}%")
                        ->orWhere('email', 'like', "%{$filters['search']}%");
                })
            )
            ->when(
                isset($filters['is_active']) && $filters['is_active'] !== null,
                fn ($q) => $q->where('is_active', $filters['is_active'])
            )
            ->orderBy('name')
            ->paginate($perPage);
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

    public function linkToClinic(int $patientId, int $clinicId, ?int $registeredBy): void
    {
        $patient = $this->findOrFail($patientId);
        $patient->clinics()->attach($clinicId, ['registered_by' => $registeredBy]);
    }

    public function unlinkFromClinic(int $patientId, int $clinicId): bool
    {
        $patient = $this->findOrFail($patientId);
        $patient->clinics()->detach($clinicId);

        return true;
    }

    public function isLinkedToClinic(int $patientId, int $clinicId): bool
    {
        return Patient::where('id', $patientId)
            ->whereHas('clinics', fn ($q) => $q->where('clinics.id', $clinicId))
            ->exists();
    }
}
