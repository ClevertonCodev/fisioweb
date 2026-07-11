<?php

namespace Modules\Admin\Services;

use Illuminate\Support\Facades\DB;
use Modules\Admin\Contracts\ExerciseRepositoryInterface;
use Modules\Admin\Contracts\Public\ExerciseSubmissionServiceInterface;
use Modules\Admin\Models\Exercise;

class ExerciseSubmissionService implements ExerciseSubmissionServiceInterface
{
    public function __construct(
        protected ExerciseRepositoryInterface $repository,
    ) {}

    public function submit(array $data, int $clinicId, int $clinicUserId): Exercise
    {
        $videoId = $data['video_id'] ?? null;
        unset($data['video_id']);

        return DB::transaction(function () use ($data, $clinicId, $clinicUserId, $videoId) {
            $exercise = $this->repository->create([
                'name'                        => $data['name'],
                'physio_area_id'              => $data['physio_area_id'],
                'difficulty_level'            => $data['difficulty_level'],
                'description'                 => $data['description'] ?? null,
                'is_active'                   => true,
                'created_by'                  => null,
                'clinic_id'                   => $clinicId,
                'submitted_by_clinic_user_id' => $clinicUserId,
                'review_status'               => Exercise::REVIEW_PENDING,
            ]);

            if (!is_null($videoId)) {
                $exercise->videos()->sync([(int) $videoId]);
            }

            return $exercise->fresh(['physioArea', 'videos']);
        });
    }

    public function approve(int $id, int $reviewerId): Exercise
    {
        return $this->review($id, Exercise::REVIEW_APPROVED, $reviewerId);
    }

    public function reject(int $id, int $reviewerId, ?string $reason = null): Exercise
    {
        return $this->review($id, Exercise::REVIEW_REJECTED, $reviewerId);
    }

    public function pendingCount(): int
    {
        return Exercise::pending()->count();
    }

    private function review(int $id, string $status, int $reviewerId): Exercise
    {
        $exercise = $this->repository->findOrFail($id);
        $exercise->update([
            'review_status' => $status,
            'reviewed_by'   => $reviewerId,
            'reviewed_at'   => now(),
        ]);

        return $exercise->fresh(['physioArea', 'videos', 'clinic', 'submittedByClinicUser']);
    }
}
