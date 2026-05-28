<?php

namespace Modules\Admin\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Modules\Admin\Contracts\AdminProgramRepositoryInterface;
use Modules\Admin\Contracts\AdminProgramServiceInterface;
use Modules\Admin\Models\AdminProgram;
use Modules\Admin\Models\AdminProgramExercise;
use Modules\Admin\Models\AdminProgramGroup;

class AdminProgramService implements AdminProgramServiceInterface
{
    public function __construct(private readonly AdminProgramRepositoryInterface $repository) {}

    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->paginate($filters, $perPage);
    }

    public function find(int $id): AdminProgram
    {
        return $this->repository->findOrFail($id);
    }

    public function findWithDetail(int $id): AdminProgram
    {
        $program = $this->repository->findOrFail($id);
        $program->load(['groups.exercises.exercise.videos', 'physioArea', 'physioSubarea', 'createdBy']);

        return $program;
    }

    public function create(array $data): AdminProgram
    {
        return DB::transaction(function () use ($data) {
            $groups    = $data['groups'] ?? [];
            $exercises = $data['exercises'] ?? [];

            unset($data['groups'], $data['exercises']);

            $data['created_by'] = Auth::guard('admin')->id();

            $program  = $this->repository->create($data);
            $groupMap = $this->syncGroups($program, $groups);
            $this->createExercises($program, $exercises, $groupMap);

            return $program;
        });
    }

    public function update(int $id, array $data): AdminProgram
    {
        return DB::transaction(function () use ($id, $data) {
            $groups    = $data['groups'] ?? [];
            $exercises = $data['exercises'] ?? [];

            unset($data['groups'], $data['exercises']);

            $program = $this->repository->update($id, $data);

            // Remove existing groups and exercises, then recreate
            $program->groups()->each(function ($group) {
                $group->exercises()->delete();
            });
            $program->groups()->delete();

            $groupMap = $this->syncGroups($program, $groups);
            $this->createExercises($program, $exercises, $groupMap);

            return $program->fresh();
        });
    }

    public function delete(int $id): bool
    {
        $program = $this->repository->findOrFail($id);
        $program->groups()->each(function ($group) {
            $group->exercises()->delete();
        });
        $program->groups()->delete();

        return $this->repository->delete($id);
    }

    /** @return array<int, int>  sortOrder => groupId */
    private function syncGroups(AdminProgram $program, array $groups): array
    {
        $groupMap = [];

        foreach ($groups as $index => $groupData) {
            $group            = AdminProgramGroup::create([
                'admin_program_id' => $program->id,
                'name'             => $groupData['name'] ?? 'Grupo ' . ($index + 1),
                'sort_order'       => $groupData['sort_order'] ?? $index,
            ]);
            $groupMap[$index] = $group->id;
        }

        return $groupMap;
    }

    private function createExercises(AdminProgram $program, array $exercises, array $groupMap): void
    {
        foreach ($exercises as $exData) {
            $groupIndex = $exData['group_index'] ?? 0;

            AdminProgramExercise::create([
                'admin_program_id'       => $program->id,
                'admin_program_group_id' => $groupMap[$groupIndex] ?? null,
                'exercise_id'            => $exData['exercise_id'],
                'days_of_week'           => $exData['days_of_week'] ?? null,
                'period'                 => $exData['period'] ?? null,
                'sets_min'               => $exData['sets_min'] ?? null,
                'sets_max'               => $exData['sets_max'] ?? null,
                'repetitions_min'        => $exData['repetitions_min'] ?? null,
                'repetitions_max'        => $exData['repetitions_max'] ?? null,
                'load_min'               => $exData['load_min'] ?? null,
                'load_max'               => $exData['load_max'] ?? null,
                'rest_time'              => $exData['rest_time'] ?? null,
                'notes'                  => $exData['notes'] ?? null,
                'sort_order'             => $exData['sort_order'] ?? 0,
            ]);
        }
    }
}
