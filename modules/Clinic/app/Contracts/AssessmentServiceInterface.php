<?php

namespace Modules\Clinic\Contracts;

use Illuminate\Support\Collection;
use Modules\Clinic\Models\Assessment;

interface AssessmentServiceInterface
{
    public function listByPatient(int $clinicId, int $patientId): Collection;

    public function findForClinic(int $id, int $clinicId): Assessment;

    /**
     * @param  array{admin_assessment_template_id: int, answers?: array<int, array{field_id: int, value?: string|null}>, answer_options?: array<int, array{field_id: int, option_id: int}>}  $dto
     */
    public function create(array $dto, int $clinicId, int $patientId, int $clinicUserId): Assessment;

    /**
     * @param  array{answers?: array<int, array{field_id: int, value?: string|null}>, answer_options?: array<int, array{field_id: int, option_id: int}>}  $dto
     */
    public function update(Assessment $assessment, array $dto): Assessment;

    public function sign(Assessment $assessment, int $clinicUserId): Assessment;

    public function destroy(Assessment $assessment): void;
}
