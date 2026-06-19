<?php

namespace Modules\Clinic\Services;

use Modules\Clinic\Models\ClinicUser;

/**
 * Value Object que centraliza a visibilidade por papel do dashboard (FR-002..005).
 *
 * Regras de escopo:
 * - secretary        → sempre clínica inteira (clinicUserId = null); `scope=mine` ignorado.
 * - admin            → clínica por padrão; `scope=mine` aplica clinicUserId = admin.id.
 * - physiotherapist  → SEMPRE forçado ao próprio id (qualquer scope recebido é ignorado).
 *
 * O backend é a autoridade: o `scope` vindo do cliente é uma sugestão, nunca
 * uma autorização (SC-004).
 */
class DashboardScope
{
    public const SCOPE_CLINIC = 'clinic';

    public const SCOPE_MINE = 'mine';

    private function __construct(
        public readonly int $clinicId,
        public readonly ?int $clinicUserId,
        public readonly string $role,
        public readonly string $timezone,
    ) {}

    public static function fromUser(ClinicUser $user, ?string $scope = null): self
    {
        $clinicUserId = null;

        if ($user->isPhysiotherapist()) {
            $clinicUserId = $user->id;
        } elseif ($user->isAdmin() && $scope === self::SCOPE_MINE) {
            $clinicUserId = $user->id;
        }

        $timezone = $user->clinic?->timezone ?: config('app.timezone');

        return new self($user->clinic_id, $clinicUserId, (string) $user->role, $timezone);
    }

    /** Verdadeiro quando a consulta abrange toda a clínica (sem filtro por profissional). */
    public function isClinicWide(): bool
    {
        return $this->clinicUserId === null;
    }

    public function currentScope(): string
    {
        return $this->isClinicWide() ? self::SCOPE_CLINIC : self::SCOPE_MINE;
    }

    /** Só admin alterna entre "Toda a clínica" e "Somente meus" (FR-004). */
    public function canToggleScope(): bool
    {
        return $this->role === ClinicUser::ROLE_ADMIN;
    }

    /** Admin/secretário escolhem o fisioterapeuta na Taxa de ocupação (FR-020). */
    public function canChooseProfessional(): bool
    {
        return in_array($this->role, [ClinicUser::ROLE_ADMIN, ClinicUser::ROLE_SECRETARY], true);
    }

    /** Feed de Atividades recentes é só de admin/secretário (FR-023). */
    public function canViewActivities(): bool
    {
        return in_array($this->role, [ClinicUser::ROLE_ADMIN, ClinicUser::ROLE_SECRETARY], true);
    }
}
