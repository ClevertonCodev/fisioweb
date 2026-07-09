<?php

namespace Modules\Admin\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Admin\Contracts\ExerciseRepositoryInterface;
use Modules\Admin\Models\Exercise;

class ExerciseRepository implements ExerciseRepositoryInterface
{
    public function __construct(
        protected Exercise $model,
    ) {}

    public function find(int $id): ?Exercise
    {
        return $this->model->find($id);
    }

    public function findOrFail(int $id): Exercise
    {
        return $this->model->findOrFail($id);
    }

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->with(['physioArea', 'physioSubarea', 'bodyRegion', 'createdBy', 'videos', 'clinic', 'submittedByClinicUser']);

        // Escopo de visibilidade da clínica: catálogo global aprovado + exercícios da própria clínica.
        if (!empty($filters['visible_to_clinic_id'])) {
            $query->visibleToClinic((int) $filters['visible_to_clinic_id']);
        }

        if (!empty($filters['review_status'])) {
            $query->where('review_status', $filters['review_status']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('muscle_group', 'like', "%{$search}%")
                    ->orWhere('therapeutic_goal', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['physio_area_id'])) {
            $query->where('physio_area_id', $filters['physio_area_id']);
        }

        if (!empty($filters['physio_subarea_id'])) {
            $query->where('physio_subarea_id', $filters['physio_subarea_id']);
        }

        if (!empty($filters['body_region_id'])) {
            $query->where('body_region_id', $filters['body_region_id']);
        }

        if (!empty($filters['difficulty_level'])) {
            $query->where('difficulty_level', $filters['difficulty_level']);
        }

        if (!empty($filters['movement_form'])) {
            $query->where('movement_form', $filters['movement_form']);
        }

        if (array_key_exists('is_active', $filters)) {
            $query->where('is_active', $filters['is_active']);
        } else {
            $query->active();
        }

        return $query->latest()->paginate($perPage)->withQueryString();
    }

    public function create(array $data): Exercise
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): Exercise
    {
        $exercise = $this->findOrFail($id);
        $exercise->update($data);

        return $exercise->fresh();
    }

    public function delete(int $id): bool
    {
        return (bool) $this->findOrFail($id)->delete();
    }
}
