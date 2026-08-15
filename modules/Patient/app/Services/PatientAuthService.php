<?php

namespace Modules\Patient\Services;

use Illuminate\Support\Collection;
use Modules\Patient\Models\Patient;
use Modules\Patient\Support\PatientIdentifier;

class PatientAuthService
{
    public const BLOCKED_STATUSES = [
        Patient::STATUS_OBITO,
        Patient::STATUS_CANCELADO,
    ];

    public function isEligible(Patient $patient): bool
    {
        if (!$patient->is_active) {
            return false;
        }

        return !in_array($patient->status, self::BLOCKED_STATUSES, true);
    }

    public function resolveClinicId(?int $clinicId, ?string $clinicSlug): ?int
    {
        if (!is_null($clinicId) && $clinicId > 0) {
            return $clinicId;
        }

        if (empty($clinicSlug)) {
            return null;
        }

        return Patient::query()
            ->whereHas('clinic', fn ($query) => $query->where('slug', $clinicSlug))
            ->value('clinic_id');
    }

    /**
     * @return Collection<int, array{id: int, name: string, slug: string|null}>
     */
    public function findClinicsFor(PatientIdentifier $identifier): Collection
    {
        return Patient::query()
            ->where($identifier->column(), $identifier->value)
            ->with('clinic:id,name,slug')
            ->get()
            ->filter(fn (Patient $patient) => $this->isEligible($patient))
            ->filter(fn (Patient $patient) => !is_null($patient->clinic))
            ->map(fn (Patient $patient) => [
                'id'   => $patient->clinic->id,
                'name' => $patient->clinic->name,
                'slug' => $patient->clinic->slug,
            ])
            ->unique('id')
            ->values();
    }
}
