<?php

namespace Modules\Admin\Services;

use Modules\Admin\Contracts\Public\PlanCatalogReadServiceInterface;
use Modules\Admin\Models\Plan;

class PlanCatalogReadService implements PlanCatalogReadServiceInterface
{
    public function findPlanIdByName(string $name): ?int
    {
        $id = Plan::query()->where('name', $name)->value('id');

        return is_null($id) ? null : (int) $id;
    }
}
