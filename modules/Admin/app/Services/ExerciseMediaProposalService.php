<?php

namespace Modules\Admin\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Admin\Contracts\ExerciseMediaProposalServiceInterface;
use Modules\Admin\Contracts\ExerciseRepositoryInterface;
use Modules\Admin\Models\Exercise;
use Modules\Media\Contracts\MediaProposal;
use Modules\Media\Contracts\VideoServiceInterface;
use Modules\Media\Exceptions\MediaProposalNotPendingException;

class ExerciseMediaProposalService implements ExerciseMediaProposalServiceInterface
{
    public function __construct(
        protected VideoServiceInterface $videos,
        protected ExerciseRepositoryInterface $exercises,
        protected ExerciseReferenceImageSyncService $referenceImages,
    ) {}

    public function list(int $page, int $perPage): array
    {
        $videoIds  = $this->videoIdsInReview();
        $pageIds   = array_slice($videoIds, ($page - 1) * $perPage, $perPage);
        $proposals = $this->videos->pendingMediaProposals($pageIds);
        $linked    = $this->exercises
            ->exercisesLinkedToVideos(array_map(fn (MediaProposal $proposal) => $proposal->videoId, $proposals))
            ->groupBy('linked_video_id');

        $items = [];
        foreach ($proposals as $proposal) {
            $exercises = $this->reviewOrder($linked->get($proposal->videoId, collect()));
            if ($exercises->isEmpty()) {
                continue;
            }

            $items[] = [
                ...$proposal->toArray(),
                'exercise'         => $this->exerciseSummary($exercises->first()),
                'linked_exercises' => $exercises->map(fn (Exercise $exercise) => $this->exerciseSummary($exercise))->values()->all(),
            ];
        }

        return [
            'items'        => $items,
            'total'        => count($videoIds),
            'current_page' => $page,
            'per_page'     => $perPage,
            'last_page'    => max(1, (int) ceil(count($videoIds) / $perPage)),
        ];
    }

    public function count(): int
    {
        return count($this->videoIdsInReview());
    }

    /**
     * @return list<int>
     */
    private function videoIdsInReview(): array
    {
        return $this->exercises->videoIdsLinkedToExercises($this->videos->videoIdsWithAnyPendingMediaProposal());
    }

    public function approve(int $exerciseId, int $videoId, string $version): void
    {
        $this->ensureVideoLinkedToExercise($exerciseId, $videoId);

        DB::transaction(function () use ($videoId, $version) {
            $proposal = $this->videos->approveMediaProposal($videoId, $version);

            if (!is_null($proposal->proposedReferenceImages)) {
                $this->referenceImages->syncFromVideo($videoId, $proposal->proposedReferenceImages, changedByOperator: true, ownerClinicId: $proposal->ownerClinicId);
            }
        });
    }

    public function reject(int $exerciseId, int $videoId, string $version): void
    {
        $this->ensureVideoLinkedToExercise($exerciseId, $videoId);

        $this->videos->rejectMediaProposal($videoId, $version);
    }

    /**
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     * @throws MediaProposalNotPendingException
     */
    private function ensureVideoLinkedToExercise(int $exerciseId, int $videoId): void
    {
        $this->exercises->findOrFail($exerciseId);

        if (!in_array($videoId, $this->exercises->linkedVideoIds($exerciseId), true)) {
            throw new MediaProposalNotPendingException;
        }
    }

    /**
     * @param  Collection<int, Exercise>  $exercises
     * @return Collection<int, Exercise>
     */
    private function reviewOrder(Collection $exercises): Collection
    {
        return $exercises
            ->sortBy(fn (Exercise $exercise) => [$exercise->review_status === Exercise::REVIEW_APPROVED ? 0 : 1, $exercise->id])
            ->values();
    }

    /**
     * @return array{id: int, name: string, review_status: string, clinic: array{id: int, name: string}|null}
     */
    private function exerciseSummary(Exercise $exercise): array
    {
        return [
            'id'            => $exercise->id,
            'name'          => $exercise->name,
            'review_status' => $exercise->review_status,
            'clinic'        => is_null($exercise->clinic) ? null : ['id' => $exercise->clinic->id, 'name' => $exercise->clinic->name],
        ];
    }
}
