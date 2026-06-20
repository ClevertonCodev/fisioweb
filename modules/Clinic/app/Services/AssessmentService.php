<?php

namespace Modules\Clinic\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Admin\Models\AdminAssessmentFieldOption;
use Modules\Admin\Models\AdminAssessmentTemplate;
use Modules\Clinic\Contracts\AssessmentServiceInterface;
use Modules\Clinic\Models\Assessment;
use Modules\Patient\Models\Patient;

class AssessmentService implements AssessmentServiceInterface
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

    public function create(array $dto, int $clinicId, int $patientId, int $clinicUserId): Assessment
    {
        $patient = Patient::query()
            ->whereKey($patientId)
            ->where('clinic_id', $clinicId)
            ->firstOrFail();

        $template = AdminAssessmentTemplate::query()
            ->active()
            ->with(['sections.fields.options'])
            ->findOrFail($dto['admin_assessment_template_id']);

        $fieldsById = $this->fieldsKeyedById($template);

        $this->assertPayloadMatchesTemplate($fieldsById, $dto['answers'] ?? [], $dto['answer_options'] ?? []);

        return DB::transaction(function () use ($dto, $clinicId, $patient, $clinicUserId, $template) {
            $assessment = Assessment::query()->create([
                'clinic_id'                    => $clinicId,
                'patient_id'                   => $patient->id,
                'clinic_user_id'               => $clinicUserId,
                'admin_assessment_template_id' => $template->id,
                'status'                       => Assessment::STATUS_DRAFT,
            ]);

            $this->persistAnswers($assessment, $dto['answers'] ?? [], $dto['answer_options'] ?? []);

            return $this->findForClinic($assessment->id, $clinicId);
        });
    }

    public function update(Assessment $assessment, array $dto): Assessment
    {
        if ($assessment->status !== Assessment::STATUS_DRAFT) {
            throw ValidationException::withMessages([
                'status' => ['Somente avaliações em rascunho podem ser editadas.'],
            ]);
        }

        $template = AdminAssessmentTemplate::query()
            ->with(['sections.fields.options'])
            ->findOrFail($assessment->admin_assessment_template_id);

        $fieldsById = $this->fieldsKeyedById($template);

        $this->assertPayloadMatchesTemplate($fieldsById, $dto['answers'] ?? [], $dto['answer_options'] ?? []);

        return DB::transaction(function () use ($assessment, $dto) {
            $assessment->answers()->delete();
            $assessment->answerOptions()->delete();
            $this->persistAnswers($assessment, $dto['answers'] ?? [], $dto['answer_options'] ?? []);

            return $this->findForClinic($assessment->id, $assessment->clinic_id);
        });
    }

    public function sign(Assessment $assessment, int $clinicUserId): Assessment
    {
        if ($assessment->status === Assessment::STATUS_SIGNED) {
            throw ValidationException::withMessages([
                'status' => ['Esta avaliação já está assinada.'],
            ]);
        }

        $assessment->update([
            'status'         => Assessment::STATUS_SIGNED,
            'signed_at'      => now(),
            'clinic_user_id' => $clinicUserId,
        ]);

        return $this->findForClinic($assessment->id, $assessment->clinic_id);
    }

    public function destroy(Assessment $assessment): void
    {
        if ($assessment->status !== Assessment::STATUS_DRAFT) {
            throw ValidationException::withMessages([
                'status' => ['Somente avaliações em rascunho podem ser excluídas.'],
            ]);
        }

        $assessment->delete();
    }

    /**
     * @param  Collection<int, \Modules\Admin\Models\AdminAssessmentField>  $fieldsById
     * @param  array<int, array{field_id: int, value?: string|null}>  $answers
     * @param  array<int, array{field_id: int, option_id: int}>  $answerOptions
     */
    private function assertPayloadMatchesTemplate(Collection $fieldsById, array $answers, array $answerOptions): void
    {
        foreach ($answers as $row) {
            $fieldId = (int) $row['field_id'];
            if (!$fieldsById->has($fieldId)) {
                throw ValidationException::withMessages([
                    'answers' => ['Um ou mais campos não pertencem ao modelo selecionado.'],
                ]);
            }
        }

        foreach ($answerOptions as $row) {
            $fieldId  = (int) $row['field_id'];
            $optionId = (int) $row['option_id'];

            if (!$fieldsById->has($fieldId)) {
                throw ValidationException::withMessages([
                    'answer_options' => ['Um ou mais campos não pertencem ao modelo selecionado.'],
                ]);
            }

            $exists = AdminAssessmentFieldOption::query()
                ->whereKey($optionId)
                ->where('admin_assessment_field_id', $fieldId)
                ->exists();

            if (!$exists) {
                throw ValidationException::withMessages([
                    'answer_options' => ['Opção inválida para o campo informado.'],
                ]);
            }
        }
    }

    /**
     * @return Collection<int, \Modules\Admin\Models\AdminAssessmentField>
     */
    private function fieldsKeyedById(AdminAssessmentTemplate $template): Collection
    {
        return $template->sections
            ->flatMap(fn ($section) => $section->fields)
            ->keyBy('id');
    }

    /**
     * @param  array<int, array{field_id: int, value?: string|null}>  $answers
     * @param  array<int, array{field_id: int, option_id: int}>  $answerOptions
     */
    private function persistAnswers(Assessment $assessment, array $answers, array $answerOptions): void
    {
        $seenFields = [];

        foreach ($answers as $row) {
            $fieldId = (int) $row['field_id'];
            if (isset($seenFields[$fieldId])) {
                continue;
            }
            $seenFields[$fieldId] = true;

            $assessment->answers()->create([
                'admin_assessment_field_id' => $fieldId,
                'value'                     => $row['value'] ?? null,
            ]);
        }

        $seenOptionKeys = [];

        foreach ($answerOptions as $row) {
            $fieldId  = (int) $row['field_id'];
            $optionId = (int) $row['option_id'];
            $key      = $fieldId . ':' . $optionId;

            if (isset($seenOptionKeys[$key])) {
                continue;
            }
            $seenOptionKeys[$key] = true;

            $assessment->answerOptions()->create([
                'admin_assessment_field_id'        => $fieldId,
                'admin_assessment_field_option_id' => $optionId,
            ]);
        }
    }
}
