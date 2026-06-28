<?php

namespace Modules\ClinicalRecord\Repositories;

use Illuminate\Support\Collection;
use Modules\ClinicalRecord\Contracts\AssessmentRepositoryInterface;
use Modules\ClinicalRecord\Models\Assessment;

class AssessmentRepository implements AssessmentRepositoryInterface
{
    public function listByPatient(int $clinicId, int $patientId): Collection
    {
        return Assessment::query()
            ->forClinic($clinicId)
            ->where('patient_id', $patientId)
            ->with(['template', 'clinicUser'])
            ->latest()
            ->get();
    }

    public function findForClinic(int $id, int $clinicId): Assessment
    {
        return Assessment::query()
            ->forClinic($clinicId)
            ->with([
                'template.sections.fields.options',
                'answers.field',
                'answerOptions.option',
                'patient',
                'clinicUser',
            ])
            ->findOrFail($id);
    }

    public function create(array $data): Assessment
    {
        return Assessment::query()->create($data);
    }

    public function deleteAnswers(Assessment $assessment): void
    {
        $assessment->answers()->delete();
        $assessment->answerOptions()->delete();
    }

    public function createAnswer(Assessment $assessment, int $fieldId, ?string $value): void
    {
        $assessment->answers()->create([
            'admin_assessment_field_id' => $fieldId,
            'value'                     => $value,
        ]);
    }

    public function createAnswerOption(Assessment $assessment, int $fieldId, int $optionId): void
    {
        $assessment->answerOptions()->create([
            'admin_assessment_field_id'        => $fieldId,
            'admin_assessment_field_option_id' => $optionId,
        ]);
    }
}
