<?php

namespace Modules\Admin\Services;

use Modules\Admin\Contracts\Public\ExerciseCatalogReadServiceInterface;
use Modules\Admin\Contracts\Public\ExercisePrescriptionDefaults;
use Modules\Admin\Models\Exercise;

class ExerciseCatalogReadService implements ExerciseCatalogReadServiceInterface
{
    public function findPrescriptionDefaults(int $exerciseId): ?ExercisePrescriptionDefaults
    {
        $exercise = Exercise::query()
            ->select(['id', 'sets', 'repetitions', 'rest_time'])
            ->find($exerciseId);

        if (is_null($exercise)) {
            return null;
        }

        return new ExercisePrescriptionDefaults(
            exerciseId: $exercise->id,
            sets: $exercise->sets,
            repetitions: $exercise->repetitions,
            restTime: $exercise->rest_time,
        );
    }

    public function visibleToClinic(array $exerciseIds, int $clinicId): array
    {
        if (empty($exerciseIds)) {
            return [];
        }

        return Exercise::query()
            ->whereIn('id', $exerciseIds)
            ->visibleToClinic($clinicId)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }
}
