<?php

namespace Modules\TreatmentProgram\Repositories;

use Modules\TreatmentProgram\Contracts\ProgramDraftRepositoryInterface;
use Modules\TreatmentProgram\Models\ClinicProgramDraft;

class ProgramDraftRepository implements ProgramDraftRepositoryInterface
{
    public function findByUser(int $clinicUserId): ?ClinicProgramDraft
    {
        return ClinicProgramDraft::where('clinic_user_id', $clinicUserId)->first();
    }

    public function upsert(int $clinicId, int $clinicUserId, array $draftData): array
    {
        $draft = ClinicProgramDraft::updateOrCreate(
            ['clinic_user_id' => $clinicUserId],
            ['clinic_id' => $clinicId, 'draft_data' => $draftData],
        );

        return [$draft, $draft->wasRecentlyCreated];
    }

    public function deleteByUser(int $clinicUserId): void
    {
        ClinicProgramDraft::where('clinic_user_id', $clinicUserId)->delete();
    }

    public function existsForUser(int $clinicUserId): bool
    {
        return ClinicProgramDraft::where('clinic_user_id', $clinicUserId)->exists();
    }
}
