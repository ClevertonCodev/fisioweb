<?php

namespace Modules\Clinic\Contracts;

use Modules\Clinic\Models\ClinicUser;

interface DashboardServiceInterface
{
    /**
     * Monta o agregado inicial do dashboard (viewer + cards + próximas consultas)
     * escopado conforme o papel do usuário e o `scope` solicitado (FR-002..010a).
     *
     * @return array<string,mixed>
     */
    public function summary(ClinicUser $user, ?string $scope = null): array;
}
