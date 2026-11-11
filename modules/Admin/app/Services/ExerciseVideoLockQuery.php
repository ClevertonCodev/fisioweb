<?php

namespace Modules\Admin\Services;

use Modules\Admin\Contracts\ExerciseRepositoryInterface;
use Modules\Media\Contracts\VideoLockQueryInterface;

class ExerciseVideoLockQuery implements VideoLockQueryInterface
{
    public function __construct(
        protected ExerciseRepositoryInterface $exercises,
    ) {}

    public function isLocked(int $videoId, int $ownerClinicId): bool
    {
        return $this->exercises->videoHasExerciseBeyondOwnerReview($videoId, $ownerClinicId);
    }
}
