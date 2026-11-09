<?php

namespace Modules\Admin\Contracts;

use Illuminate\Support\Collection;
use Modules\Admin\Models\LoginAsAudit;

interface LoginAsAuditRepositoryInterface
{
    /**
     * @param  array{admin_user_id: int, clinic_id: int, clinic_user_id: int, ip: ?string, user_agent: ?string}  $data
     */
    public function create(array $data): LoginAsAudit;

    /**
     * @return Collection<int, LoginAsAudit> com o operador carregado
     */
    public function latestForClinic(int $clinicId, int $limit): Collection;
}
