<?php

namespace Modules\Admin\Services;

use Modules\Admin\Contracts\LoginAsAuditRepositoryInterface;
use Modules\Admin\Contracts\Public\LoginAsAuditEntry;
use Modules\Admin\Contracts\Public\LoginAsAuditServiceInterface;
use Modules\Admin\Contracts\Public\RecentLoginAs;
use Modules\Admin\Models\LoginAsAudit;

class LoginAsAuditService implements LoginAsAuditServiceInterface
{
    public function __construct(
        protected LoginAsAuditRepositoryInterface $audits,
    ) {}

    public function record(LoginAsAuditEntry $entry): void
    {
        $this->audits->create([
            'admin_user_id'  => $entry->adminUserId,
            'clinic_id'      => $entry->clinicId,
            'clinic_user_id' => $entry->clinicUserId,
            'ip'             => $entry->ip,
            'user_agent'     => is_null($entry->userAgent) ? null : mb_substr($entry->userAgent, 0, 512),
        ]);
    }

    public function recentForClinic(int $clinicId, int $limit = 10): array
    {
        return $this->audits->latestForClinic($clinicId, $limit)
            ->map(fn (LoginAsAudit $audit) => new RecentLoginAs(
                operatorName: (string) $audit->operator?->name,
                clinicUserId: $audit->clinic_user_id,
                createdAt: $audit->created_at,
            ))
            ->values()
            ->all();
    }
}
