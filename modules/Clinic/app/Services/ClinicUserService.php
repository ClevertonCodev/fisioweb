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
            ->get(['id', 'name', 'email', 'role', 'mestre', 'status', 'document']);
    }

    public function create(array $data, int $clinicId): ClinicUser
    {
        unset($data['mestre']);

        return ClinicUser::create(array_merge($data, [
            'clinic_id' => $clinicId,
            'mestre'    => ClinicUser::MESTRE_NO,
            'status'    => $data['status'] ?? ClinicUser::STATUS_ACTIVE,
        ]));
    }

    public function update(ClinicUser $clinicUser, array $data): ClinicUser
    {
        unset($data['mestre']);

        $authUser = auth('clinic')->user();

        if ($authUser instanceof ClinicUser && ! $authUser->isAdmin()) {
            unset($data['role'], $data['status']);

            if ((int) $clinicUser->id !== (int) $authUser->id) {
                abort(403, 'Você só pode editar o seu próprio perfil.');
            }
        }

        if (
            $clinicUser->isMaster()
            && array_key_exists('role', $data)
            && $data['role'] !== ClinicUser::ROLE_ADMIN
        ) {
            abort(422, 'O usuário mestre da clínica deve permanecer como administrador.');
        }

        $clinicUser->update($data);

        return $clinicUser->fresh();
    }

    public function delete(ClinicUser $clinicUser): void
    {
        if ($clinicUser->isMaster()) {
            abort(422, 'Não é possível remover o usuário mestre da clínica.');
        }

        $adminCount = ClinicUser::where('clinic_id', $clinicUser->clinic_id)
            ->where('role', ClinicUser::ROLE_ADMIN)
            ->count();

        if ($clinicUser->isAdmin() && $adminCount <= 1) {
            abort(422, 'Não é possível remover o último administrador da clínica.');
        }

        $clinicUser->delete();
    }
}
