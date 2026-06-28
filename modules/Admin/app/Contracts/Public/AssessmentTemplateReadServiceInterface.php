<?php

namespace Modules\Admin\Contracts\Public;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface AssessmentTemplateReadServiceInterface
{
    public function findActiveForValidation(int $templateId): ?array;

    public function listActive(?string $search, int $perPage): LengthAwarePaginator;

    public function findActiveForShow(int $id): ?array;
}
