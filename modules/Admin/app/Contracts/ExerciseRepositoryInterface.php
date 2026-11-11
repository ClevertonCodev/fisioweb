<?php

namespace Modules\Admin\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Modules\Admin\Models\Exercise;

interface ExerciseRepositoryInterface
{
    public function find(int $id): ?Exercise;

    public function findOrFail(int $id): Exercise;

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): Exercise;

    public function update(int $id, array $data): Exercise;

    public function delete(int $id): bool;

    /**
     * Grava só se o exercício não está aprovado, na mesma instrução: um aprovar concorrente não é desfeito.
     *
     * @param  array<string, mixed>  $data
     * @return bool falso quando o exercício não existe ou já está aprovado
     */
    public function updateUnlessApproved(int $id, array $data): bool;

    /**
     * @return list<int>
     */
    public function linkedVideoIds(int $exerciseId): array;

    public function videoHasExerciseBeyondOwnerReview(int $videoId, int $ownerClinicId): bool;

    /**
     * @param  list<int>  $videoIds
     * @return Collection<int, Exercise> cada exercício com `linked_video_id` e a `clinic` carregada, um por ligação
     */
    public function exercisesLinkedToVideos(array $videoIds): Collection;

    /**
     * @param  list<int>  $videoIds
     * @return list<int> os vídeos, entre os informados, ligados a pelo menos um exercício, em ordem de id
     */
    public function videoIdsLinkedToExercises(array $videoIds): array;
}
