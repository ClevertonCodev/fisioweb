<?php

namespace Modules\Clinic\Contracts;

interface ClinicUserPreferenceRepositoryInterface
{
    /**
     * @param  list<string>  $keys
     * @return array<string, mixed> chave → valor, só das chaves com valor salvo
     */
    public function findForUser(int $clinicUserId, array $keys): array;

    public function upsert(int $clinicId, int $clinicUserId, string $key, mixed $value): void;
}
