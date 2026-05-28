<?php

namespace Modules\Admin\Repositories;

use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Admin\Contracts\AdminProgramRepositoryInterface;
use Modules\Admin\Models\AdminProgram;

class AdminProgramRepository implements AdminProgramRepositoryInterface
{
    public function __construct(private readonly AdminProgram $model) {}

    public function find(int $id): ?AdminProgram
    {
        return $this->model->find($id);
    }

    public function findOrFail(int $id): AdminProgram
    {
        return $this->model->findOrFail($id);
    }

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery()->with(['physioArea', 'physioSubarea', 'createdBy']);

        if (!empty($filters['search'])) {
            $query->where('title', 'like', '%' . $filters['search'] . '%');
        }

        if (!empty($filters['physio_area_id'])) {
            $query->where('physio_area_id', $filters['physio_area_id']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        return $query->latest()->paginate($perPage)->appends(request()->query());
    }

    public function create(array $data): AdminProgram
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): AdminProgram
    {
        $program = $this->findOrFail($id);
        $program->update($data);

        return $program->fresh();
    }

    public function delete(int $id): bool
    {
        $program = $this->findOrFail($id);

        return $program->delete();
    }
}
