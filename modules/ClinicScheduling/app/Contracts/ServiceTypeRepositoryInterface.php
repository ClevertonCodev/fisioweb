<?php

namespace Modules\ClinicScheduling\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Modules\ClinicScheduling\Models\ServiceType;

interface ServiceTypeRepositoryInterface
{
    /** A clínica já teve algum tipo, mesmo apagado? */
    public function clinicHasAnyIncludingDeleted(int $clinicId): bool;

    /**
     * @return Collection<int, ServiceType>
     */
    public function listForClinic(int $clinicId): Collection;

    public function create(int $clinicId, string $name, int $durationMinutes, int $position): ServiceType;

    public function update(ServiceType $type, string $name, int $durationMinutes, int $position): void;

    /**
     * Apaga (soft delete) os tipos da clínica que não estão em `$keepIds`.
     *
     * @param  list<int>  $keepIds
     */
    public function deleteForClinicExcept(int $clinicId, array $keepIds): void;
}
