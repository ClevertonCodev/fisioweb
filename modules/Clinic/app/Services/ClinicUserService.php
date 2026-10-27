<?php

namespace Modules\Clinic\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Clinic\Contracts\ClinicUserServiceInterface;
use Modules\Clinic\Models\ClinicUser;

class ClinicUserService implements ClinicUserServiceInterface
{
    /**
     * Credenciais do Google zeradas: sem elas, o pull e o push da agenda param
     * para a pessoa. Quem é desativado ou excluído perde também esse canal.
     */
    private const GOOGLE_DISCONNECTED = [
        'google_access_token'     => null,
        'google_refresh_token'    => null,
        'google_token_expires_at' => null,
        'google_calendar_id'      => null,
        'google_sync_token'       => null,
        'google_connected_at'     => null,
    ];

    public function listForClinic(int $clinicId): Collection
    {
        return ClinicUser::where('clinic_id', $clinicId)
            ->orderBy('name')
            ->get([
                'id', 'name', 'email', 'role', 'mestre', 'status', 'document', 'photo_url',
                'two_factor_confirmed_at', 'google_connected_at',
            ]);
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

        if ($authUser instanceof ClinicUser && !$authUser->isAdmin()) {
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

        return DB::transaction(function () use ($clinicUser, $data): ClinicUser {
            $activeAdminIds = $this->lockActiveAdminIds((int) $clinicUser->clinic_id);
            $target         = $this->lockTarget($clinicUser);

            if ($target->isMaster() && $this->deactivates($target, $data)) {
                abort(422, 'O usuário mestre da clínica não pode ser desativado.');
            }

            if ($this->removesActiveAdmin($target, $data) && $activeAdminIds->count() <= 1) {
                abort(422, 'A clínica precisa de pelo menos um administrador ativo.');
            }

            $deactivates = $this->deactivates($target, $data);
            $target->update($data);

            // Desativar corta também a sincronização com o Google Agenda (ADR 022).
            if ($deactivates) {
                $target->forceFill(self::GOOGLE_DISCONNECTED)->save();
            }

            return $target->fresh();
        });
    }

    public function delete(ClinicUser $clinicUser): void
    {
        if ($clinicUser->isMaster()) {
            abort(422, 'Não é possível remover o usuário mestre da clínica.');
        }

        DB::transaction(function () use ($clinicUser): void {
            $activeAdminIds = $this->lockActiveAdminIds((int) $clinicUser->clinic_id);
            $target         = $this->lockTarget($clinicUser);

            if ($this->isActiveAdmin($target) && $activeAdminIds->count() <= 1) {
                abort(422, 'Não é possível remover o último administrador da clínica.');
            }

            // Inativo junto (nem um rollback do soft delete devolve o acesso) e
            // sem a credencial do Google, que não serve a ninguém depois daqui.
            $target->forceFill(['status' => ClinicUser::STATUS_INACTIVE] + self::GOOGLE_DISCONNECTED)->save();

            // Soft delete: a agenda, o financeiro e o histórico continuam.
            $target->delete();
        });
    }

    /** Só a passagem de ativo para inativo conta; manter inativo não. */
    private function deactivates(ClinicUser $target, array $data): bool
    {
        return array_key_exists('status', $data)
            && (int) $data['status'] === ClinicUser::STATUS_INACTIVE
            && (int) $target->status === ClinicUser::STATUS_ACTIVE;
    }

    private function isActiveAdmin(ClinicUser $clinicUser): bool
    {
        return $clinicUser->isAdmin() && (int) $clinicUser->status === ClinicUser::STATUS_ACTIVE;
    }

    /** O alvo é admin ativo e a mudança tira o papel admin ou desativa. */
    private function removesActiveAdmin(ClinicUser $target, array $data): bool
    {
        if (!$this->isActiveAdmin($target)) {
            return false;
        }

        $demotes = array_key_exists('role', $data) && $data['role'] !== ClinicUser::ROLE_ADMIN;

        return $demotes || $this->deactivates($target, $data);
    }

    /** O alvo relido e travado: a decisão usa o estado de agora, não o da rota. */
    private function lockTarget(ClinicUser $clinicUser): ClinicUser
    {
        return ClinicUser::whereKey($clinicUser->id)->lockForUpdate()->firstOrFail();
    }

    /**
     * Admins ativos da clínica, travados até o fim da transação e sempre antes
     * do alvo, em ordem de id: pedidos simultâneos na mesma clínica passam um
     * de cada vez e não deixam a clínica sem administrador ativo. (Os testes
     * rodam em SQLite, onde o lock não faz nada: a garantia vale no Postgres.)
     */
    private function lockActiveAdminIds(int $clinicId): Collection
    {
        return ClinicUser::where('clinic_id', $clinicId)
            ->where('role', ClinicUser::ROLE_ADMIN)
            ->where('status', ClinicUser::STATUS_ACTIVE)
            ->orderBy('id')
            ->lockForUpdate()
            ->pluck('id');
    }
}
