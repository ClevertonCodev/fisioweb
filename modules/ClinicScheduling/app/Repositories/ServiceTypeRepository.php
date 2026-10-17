<?php

namespace Modules\ClinicScheduling\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\ClinicScheduling\Contracts\ServiceTypeRepositoryInterface;
use Modules\ClinicScheduling\Models\ServiceType;

class ServiceTypeRepository implements ServiceTypeRepositoryInterface
{
    public function clinicHasAnyIncludingDeleted(int $clinicId): bool
    {
        return ServiceType::withTrashed()->where('clinic_id', $clinicId)->exists();
    }

    public function listForClinic(int $clinicId): Collection
    {
        return ServiceType::query()
            ->where('clinic_id', $clinicId)
            ->orderBy('position')
            ->orderBy('id')
            ->get();
    }

    public function create(int $clinicId, string $name, int $durationMinutes, int $position): ServiceType
    {
        return ServiceType::query()->create([
            'clinic_id'        => $clinicId,
            'name'             => $name,
            'duration_minutes' => $durationMinutes,
            'position'         => $position,
        ]);
    }

    public function update(ServiceType $type, string $name, int $durationMinutes, int $position): void
    {
        $type->update([
            'name'             => $name,
            'duration_minutes' => $durationMinutes,
            'position'         => $position,
        ]);
    }

    public function deleteForClinicExcept(int $clinicId, array $keepIds): void
    {
        ServiceType::query()
            ->where('clinic_id', $clinicId)
            ->whereNotIn('id', $keepIds)
            ->delete();
    }
}
