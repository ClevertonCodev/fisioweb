<?php

namespace Modules\Admin\Repositories;

use Illuminate\Support\Collection;
use Modules\Admin\Contracts\LoginAsAuditRepositoryInterface;
use Modules\Admin\Models\LoginAsAudit;

class LoginAsAuditRepository implements LoginAsAuditRepositoryInterface
{
    public function create(array $data): LoginAsAudit
    {
        return LoginAsAudit::create($data);
    }

    public function latestForClinic(int $clinicId, int $limit): Collection
    {
        return LoginAsAudit::query()
            ->with('operator:id,name')
            ->where('clinic_id', $clinicId)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();
    }
}
