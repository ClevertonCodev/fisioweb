<?php

namespace Modules\TreatmentProgram\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Modules\TreatmentProgram\Contracts\ProgramDraftRepositoryInterface;
use Modules\TreatmentProgram\Contracts\ProgramDraftServiceInterface;
use Modules\TreatmentProgram\Events\ProgramDraftCreated;
use Modules\TreatmentProgram\Events\ProgramDraftUpdated;

class ProgramDraftService implements ProgramDraftServiceInterface
{
    private const EVENT_VERSION = 1;

    public function __construct(
        protected ProgramDraftRepositoryInterface $repository,
    ) {}

    public function showForUser(int $clinicUserId): ?array
    {
        return $this->repository->findByUser($clinicUserId)?->draft_data;
    }

    public function upsertForUser(int $clinicId, int $clinicUserId, array $draftData): void
    {
        [$draft, $wasCreated] = $this->repository->upsert($clinicId, $clinicUserId, $draftData);

        $event = $wasCreated
            ? new ProgramDraftCreated(
                self::EVENT_VERSION,
                (int) $draft->id,
                (int) $draft->clinic_id,
                (int) $draft->clinic_user_id,
                CarbonImmutable::now(),
            )
            : new ProgramDraftUpdated(
                self::EVENT_VERSION,
                (int) $draft->id,
                (int) $draft->clinic_id,
                (int) $draft->clinic_user_id,
                CarbonImmutable::now(),
            );

        DB::afterCommit(fn () => Event::dispatch($event));
    }

    public function destroyForUser(int $clinicUserId): void
    {
        $this->repository->deleteByUser($clinicUserId);
    }
}
