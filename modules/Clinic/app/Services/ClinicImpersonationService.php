<?php

namespace Modules\Clinic\Services;

use Closure;
use Modules\Admin\Contracts\Public\LoginAsAuditEntry;
use Modules\Admin\Contracts\Public\LoginAsAuditServiceInterface;
use Modules\Admin\Contracts\Public\RecentLoginAs;
use Modules\Clinic\Contracts\ClinicImpersonationServiceInterface;
use Modules\Clinic\Contracts\ClinicRepositoryInterface;
use Modules\Clinic\Data\ImpersonationSession;

class ClinicImpersonationService implements ClinicImpersonationServiceInterface
{
    private const RECENT_LIMIT = 10;

    public function __construct(
        protected ClinicRepositoryInterface $clinicRepository,
        protected LoginAsAuditServiceInterface $loginAsAudits,
    ) {}

    public function impersonate(int $clinicId, int $operatorId, ?string $ip, ?string $userAgent, Closure $issueToken): ImpersonationSession
    {
        $clinic = $this->clinicRepository->findOrFail($clinicId);

        if ($clinic->isCancelled()) {
            abort(422, 'A clínica está cancelada. Reative-a para entrar.');
        }

        // Só admin ativo: o guard da clínica recusa token de inativo.
        $clinicUser = $this->clinicRepository->findActiveAdminForImpersonation($clinic->id);

        if (is_null($clinicUser)) {
            abort(422, 'A clínica não tem administrador ativo para entrar como ele.');
        }

        $token = $issueToken($clinicUser, ['impersonated_by' => $operatorId]);

        $this->loginAsAudits->record(new LoginAsAuditEntry(
            adminUserId: $operatorId,
            clinicId: $clinic->id,
            clinicUserId: $clinicUser->id,
            ip: $ip,
            userAgent: $userAgent,
        ));

        return new ImpersonationSession($clinicUser, $token);
    }

    public function recentLoginAs(int $clinicId): array
    {
        $entries = $this->loginAsAudits->recentForClinic($clinicId, self::RECENT_LIMIT);
        $names   = $this->clinicRepository->clinicUserNames(
            $clinicId,
            array_values(array_unique(array_map(fn (RecentLoginAs $entry) => $entry->clinicUserId, $entries))),
        );

        return array_map(fn (RecentLoginAs $entry) => [
            'operator_name'    => $entry->operatorName,
            'clinic_user_name' => $names[$entry->clinicUserId] ?? null,
            'created_at'       => $entry->createdAt->format(DATE_ATOM),
        ], $entries);
    }
}
