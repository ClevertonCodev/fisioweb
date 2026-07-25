<?php

namespace Modules\TreatmentProgram\Repositories;

use Illuminate\Support\Collection;
use Modules\TreatmentProgram\Contracts\PatientProgramRepositoryInterface;
use Modules\TreatmentProgram\Models\TreatmentPlan;

class EloquentPatientProgramRepository implements PatientProgramRepositoryInterface
{
    public function __construct(
        protected TreatmentPlan $model,
    ) {}

    public function findByPublicToken(string $publicToken): ?TreatmentPlan
    {
        return $this->model->newQuery()
            ->where('public_token', $publicToken)
            ->where('status', '!=', TreatmentPlan::STATUS_DRAFT)
            ->with([
                'clinicUser',
                'clinic',
                'groups.exercises.exercise.videos',
            ])
            ->withCount('exercises')
            ->first();
    }

    public function findOwnedByPublicToken(string $publicToken, int $clinicId, int $patientId): ?TreatmentPlan
    {
        return $this->model->newQuery()
            ->where('public_token', $publicToken)
            ->where('clinic_id', $clinicId)
            ->where('patient_id', $patientId)
            ->where('status', '!=', TreatmentPlan::STATUS_DRAFT)
            ->with([
                'clinicUser',
                'clinic',
                'groups.exercises.exercise.videos',
            ])
            ->withCount('exercises')
            ->first();
    }

    public function listByPatientClinic(int $patientId, int $clinicId): Collection
    {
        return $this->model->newQuery()
            ->where('patient_id', $patientId)
            ->where('clinic_id', $clinicId)
            ->where('status', '!=', TreatmentPlan::STATUS_DRAFT)
            ->with(['clinicUser', 'clinic'])
            ->withCount('exercises')
            ->latest()
            ->get();
    }
}
