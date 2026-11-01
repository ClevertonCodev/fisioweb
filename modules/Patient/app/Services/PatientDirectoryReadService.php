<?php

namespace Modules\Patient\Services;

use Modules\Patient\Contracts\PatientRepositoryInterface;
use Modules\Patient\Contracts\Public\PatientDirectoryReadServiceInterface;
use Modules\Patient\Data\Public\PatientNameDTO;

class PatientDirectoryReadService implements PatientDirectoryReadServiceInterface
{
    public function __construct(
        protected PatientRepositoryInterface $repository,
    ) {}

    public function namesByIds(int $clinicId, array $ids): array
    {
        $names = [];
        foreach ($this->repository->namesForClinic($clinicId, $ids) as $row) {
            $names[(int) $row->id] = new PatientNameDTO((int) $row->id, (string) $row->name);
        }

        return $names;
    }

    public function searchByName(int $clinicId, string $term, int $limit = 20, bool $withTrashed = false): array
    {
        // `empty`: "0" também não busca, como o `q=0` da busca de Finanças, que não filtra nada.
        $term = trim($term);
        if (empty($term)) {
            return [];
        }

        return $this->repository->searchNamesForClinic($clinicId, $term, $limit, $withTrashed)
            ->map(fn (object $row) => new PatientNameDTO((int) $row->id, (string) $row->name))
            ->values()
            ->all();
    }
}
