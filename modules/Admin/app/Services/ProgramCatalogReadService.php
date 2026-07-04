<?php

namespace Modules\Admin\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Admin\Contracts\Public\ProgramCatalogReadServiceInterface;
use Modules\Admin\Models\AdminProgram;

class ProgramCatalogReadService implements ProgramCatalogReadServiceInterface
{
    public function paginate(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = AdminProgram::with(['physioArea'])
            ->withCount('exercises')
            ->where('is_active', true);

        $search = $filters['search'] ?? null;
        if (!empty($search)) {
            $query->where('title', 'like', '%' . $search . '%');
        }

        $physioAreaId = (int) ($filters['physio_area_id'] ?? 0);
        if ($physioAreaId > 0) {
            $query->where('physio_area_id', $physioAreaId);
        }

        return $query->latest()->paginate($perPage);
    }

    public function findActiveWithDetails(int $id): AdminProgram
    {
        return AdminProgram::with([
            'physioArea',
            'createdBy',
            'groups.exercises.exercise.videos',
        ])
            ->withCount('exercises')
            ->where('is_active', true)
            ->findOrFail($id);
    }
}
