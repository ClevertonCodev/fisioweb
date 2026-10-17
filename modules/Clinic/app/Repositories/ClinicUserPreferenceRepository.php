<?php

namespace Modules\Clinic\Repositories;

use Modules\Clinic\Contracts\ClinicUserPreferenceRepositoryInterface;
use Modules\Clinic\Models\ClinicUserPreference;

class ClinicUserPreferenceRepository implements ClinicUserPreferenceRepositoryInterface
{
    public function findForUser(int $clinicUserId, array $keys): array
    {
        return ClinicUserPreference::query()
            ->where('clinic_user_id', $clinicUserId)
            ->whereIn('key', $keys)
            ->get(['key', 'value'])
            ->mapWithKeys(fn (ClinicUserPreference $pref) => [$pref->key => $pref->value])
            ->all();
    }

    public function upsert(int $clinicId, int $clinicUserId, string $key, mixed $value): void
    {
        ClinicUserPreference::query()->updateOrCreate(
            ['clinic_user_id' => $clinicUserId, 'key' => $key],
            ['clinic_id' => $clinicId, 'value' => $value],
        );
    }
}
