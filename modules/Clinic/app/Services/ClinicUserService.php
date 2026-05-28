<?php

namespace Modules\Clinic\Services;

use Illuminate\Support\Collection;
use Modules\Clinic\Contracts\ClinicUserServiceInterface;
use Modules\Clinic\Models\ClinicUser;

class ClinicUserService implements ClinicUserServiceInterface
{
    public function listForClinic(int $clinicId): Collection
    {
        return ClinicUser::where('clinic_id', $clinicId)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'status', 'document']);
    }

    public function create(array $data, int $clinicId): ClinicUser
    {
        return ClinicUser::create(array_merge($data, ['clinic_id' => $clinicId]));
    }

    public function update(ClinicUser $clinicUser, array $data): ClinicUser
    {
        $firstUserId = (int) ClinicUser::where('clinic_id', $clinicUser->clinic_id)->min('id');

        if (
            (int) $clinicUser->id === $firstUserId
            && array_key_exists('role', $data)
            && $data['role'] !== ClinicUser::ROLE_ADMIN
        ) {
            abort(422, 'O primeiro usuário cadastrado na clínica deve permanecer como administrador.');
        }

        $clinicUser->update($data);

        return $clinicUser->fresh();
    }

    public function delete(ClinicUser $clinicUser): void
    {
        $adminCount = ClinicUser::where('clinic_id', $clinicUser->clinic_id)
            ->where('role', ClinicUser::ROLE_ADMIN)
            ->count();

        if ($clinicUser->isAdmin() && $adminCount <= 1) {
            abort(422, 'Não é possível remover o último administrador da clínica.');
        }

        $clinicUser->delete();
    }
}
