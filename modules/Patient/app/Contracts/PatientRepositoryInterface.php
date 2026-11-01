<?php

namespace Modules\Patient\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Modules\Patient\Models\Patient;

interface PatientRepositoryInterface
{
    public function find(int $id): ?Patient;

    public function findOrFail(int $id): Patient;

    public function paginateByClinic(int $clinicId, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): Patient;

    public function update(int $id, array $data): Patient;

    public function bulkInactivate(int $clinicId, array $ids): int;

    /** Reativa o paciente da clínica; null se ele não é dessa clínica. */
    public function reactivate(int $clinicId, int $id): ?Patient;

    /**
     * `id` e `name` dos pacientes da clínica com esses ids, inclusive os excluídos.
     *
     * @param  list<int>  $ids
     * @return Collection<int, object{id: int, name: string}>
     */
    public function namesForClinic(int $clinicId, array $ids): Collection;

    /**
     * `id` e `name` dos pacientes da clínica cujo nome contém o termo (sem diferenciar
     * maiúscula), em ordem alfabética.
     *
     * @return Collection<int, object{id: int, name: string}>
     */
    public function searchNamesForClinic(int $clinicId, string $term, int $limit, bool $withTrashed = false): Collection;
}
