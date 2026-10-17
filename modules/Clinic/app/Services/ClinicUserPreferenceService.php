<?php

namespace Modules\Clinic\Services;

use Modules\Clinic\Contracts\ClinicUserPreferenceRepositoryInterface;
use Modules\Clinic\Contracts\ClinicUserPreferenceServiceInterface;
use Modules\Clinic\Enums\ClinicUserPreferenceKey;
use Modules\Clinic\Models\ClinicUser;

/**
 * Preferências do próprio usuário autenticado: o dono vem sempre do usuário,
 * nunca da requisição.
 */
class ClinicUserPreferenceService implements ClinicUserPreferenceServiceInterface
{
    public function __construct(
        private readonly ClinicUserPreferenceRepositoryInterface $repository,
    ) {}

    public function get(ClinicUser $user, array $keys): array
    {
        return $this->repository->findForUser(
            (int) $user->id,
            array_map(fn (ClinicUserPreferenceKey $key) => $key->value, $keys),
        );
    }

    public function set(ClinicUser $user, ClinicUserPreferenceKey $key, mixed $value): mixed
    {
        $this->repository->upsert((int) $user->clinic_id, (int) $user->id, $key->value, $value);

        return $value;
    }
}
