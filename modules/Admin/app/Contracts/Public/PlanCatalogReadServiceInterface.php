<?php

namespace Modules\Admin\Contracts\Public;

interface PlanCatalogReadServiceInterface
{
    public function findPlanIdByName(string $name): ?int;
}
