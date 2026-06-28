<?php

namespace Modules\ClinicalRecord\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Validation\ValidationException;
use Modules\Admin\Contracts\Public\AssessmentTemplateReadServiceInterface;
use Modules\ClinicalRecord\Contracts\AssessmentRepositoryInterface;
use Modules\ClinicalRecord\Contracts\AssessmentServiceInterface;
use Modules\ClinicalRecord\Events\AssessmentCompleted;
use Modules\ClinicalRecord\Events\AssessmentCreated;
use Modules\ClinicalRecord\Events\AssessmentUpdated;
use Modules\ClinicalRecord\Models\Assessment;

class AssessmentService implements AssessmentServiceInterface
{
    private const EVENT_VERSION = 1;

    public function __construct(
        protected AssessmentRepositoryInterface $repository,
        protected AssessmentTemplateReadServiceInterface $templateReadService,
    ) {}

    public function listByPatient(int $clinicId, int $patientId): Collection
    {
        return $this->repository->listByPatient($clinicId, $patientId);
    }

    public function findForClinic(int $id, int $clinicId): Assessment
    {
        return $this->repository->findForClinic($id, $clinicId);
    }

    public function create(array $dto, int $clinicId, int $patientId, int $clinicUserId): Assessment
    {
        $template = $this->templateReadService->findActiveForValidation((int) $dto['admin_assessment_template_id']);

        if (is_null($template)) {
            throw ValidationException::withMessages([
                'admin_assessment_template_id' => ['Template de avaliação inválido ou inativo.'],
            ]);
        }

        $this->assertPayloadMatchesTemplate($template, $dto['answers'] ?? [], $dto['answer_options'] ?? []);

        return DB::transaction(function () use ($dto, $clinicId, $patientId, $clinicUserId, $template) {
            $assessment = $this->repository->create([
                'clinic_id'                    => $clinicId,
                'patient_id'                   => $patientId,
                'clinic_user_id'               => $clinicUserId,
                'admin_assessment_template_id' => (int) $template['id'],
                'status'                       => Assessment::STATUS_DRAFT,
            ]);

            $this->persistAnswers($assessment, $dto['answers'] ?? [], $dto['answer_options'] ?? []);

            $assessment = $this->findForClinic($assessment->id, $clinicId);

            $this->dispatchEvent(new AssessmentCreated(...$this->eventPayload($assessment)));

            return $assessment;
        });
    }

    public function update(Assessment $assessment, array $dto): Assessment
    {
        if ($assessment->status !== Assessment::STATUS_DRAFT) {
            throw ValidationException::withMessages([
                'status' => ['Somente avaliações em rascunho podem ser editadas.'],
            ]);
        }

        $template = $this->templateReadService->findActiveForValidation((int) $assessment->admin_assessment_template_id);
        if (is_null($template)) {
            throw ValidationException::withMessages([
                'admin_assessment_template_id' => ['Template de avaliação inválido ou inativo.'],
            ]);
        }

        $this->assertPayloadMatchesTemplate($template, $dto['answers'] ?? [], $dto['answer_options'] ?? []);

        return DB::transaction(function () use ($assessment, $dto) {
            $this->repository->deleteAnswers($assessment);
            $this->persistAnswers($assessment, $dto['answers'] ?? [], $dto['answer_options'] ?? []);

            $assessment = $this->findForClinic($assessment->id, $assessment->clinic_id);

            $this->dispatchEvent(new AssessmentUpdated(...$this->eventPayload($assessment)));

            return $assessment;
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

        $assessment = $this->findForClinic($assessment->id, $assessment->clinic_id);
        $this->dispatchEvent(new AssessmentCompleted(...$this->eventPayload($assessment)));

        return $assessment;
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

    private function assertPayloadMatchesTemplate(array $template, array $answers, array $answerOptions): void
    {
        $fields = collect($template['sections'] ?? [])
            ->flatMap(fn (array $section): array => $section['fields'] ?? [])
            ->keyBy(fn (array $field): int => (int) $field['id']);

        foreach ($answers as $row) {
            $fieldId = (int) $row['field_id'];
            if (!$fields->has($fieldId)) {
                throw ValidationException::withMessages([
                    'answers' => ['Um ou mais campos não pertencem ao modelo selecionado.'],
                ]);
            }
        }

        foreach ($answerOptions as $row) {
            $fieldId  = (int) $row['field_id'];
            $optionId = (int) $row['option_id'];

            if (!$fields->has($fieldId)) {
                throw ValidationException::withMessages([
                    'answer_options' => ['Um ou mais campos não pertencem ao modelo selecionado.'],
                ]);
            }

            $field     = $fields->get($fieldId);
            $optionIds = collect($field['options'] ?? [])->pluck('id')->map(fn ($id): int => (int) $id)->all();

            if (!in_array($optionId, $optionIds, true)) {
                throw ValidationException::withMessages([
                    'answer_options' => ['Opção inválida para o campo informado.'],
                ]);
            }
        }
    }

    private function persistAnswers(Assessment $assessment, array $answers, array $answerOptions): void
    {
        $seenFields = [];
        foreach ($answers as $row) {
            $fieldId = (int) $row['field_id'];
            if (isset($seenFields[$fieldId])) {
                continue;
            }

            $seenFields[$fieldId] = true;
            $this->repository->createAnswer($assessment, $fieldId, $row['value'] ?? null);
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
            $this->repository->createAnswerOption($assessment, $fieldId, $optionId);
        }
    }

    private function eventPayload(Assessment $assessment): array
    {
        return [
            self::EVENT_VERSION,
            (int) $assessment->id,
            (int) $assessment->clinic_id,
            (int) $assessment->patient_id,
            !is_null($assessment->clinic_user_id) ? (int) $assessment->clinic_user_id : null,
            Auth::guard('clinic')->id(),
            !is_null($assessment->admin_assessment_template_id) ? (int) $assessment->admin_assessment_template_id : null,
            (string) $assessment->status,
            CarbonImmutable::now(),
        ];
    }

    private function dispatchEvent(object $event): void
    {
        DB::afterCommit(fn () => Event::dispatch($event));
    }
}
