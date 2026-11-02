<?php

namespace Modules\ClinicQuestionnaire\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Validation\ValidationException;
use Modules\ClinicQuestionnaire\Contracts\QuestionnaireTemplateRepositoryInterface;
use Modules\ClinicQuestionnaire\Contracts\QuestionnaireTemplateServiceInterface;
use Modules\ClinicQuestionnaire\Events\QuestionnaireTemplateCreated;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;

class QuestionnaireTemplateService implements QuestionnaireTemplateServiceInterface
{
    private const EVENT_VERSION = 1;

    public function __construct(
        protected QuestionnaireTemplateRepositoryInterface $repository,
    ) {}

    public function listForClinic(int $clinicId): Collection
    {
        return $this->repository->listForClinic($clinicId);
    }

    public function find(int $id): QuestionnaireTemplate
    {
        return $this->repository->find($id);
    }

    public function create(array $dto, int $clinicId): QuestionnaireTemplate
    {
        return DB::transaction(function () use ($dto, $clinicId) {
            $template = $this->repository->create([
                'clinic_id'   => $clinicId,
                'title'       => $dto['title'],
                'description' => $dto['description'] ?? null,
                'is_active'   => true,
            ]);

            $this->repository->replaceSections($template, $dto['sections'] ?? []);

            $template = $this->find($template->id);

            $this->dispatchEvent(new QuestionnaireTemplateCreated(
                self::EVENT_VERSION,
                (int) $template->id,
                (int) $template->clinic_id,
                (string) $template->title,
                CarbonImmutable::now(),
            ));

            return $template;
        });
    }

    public function update(QuestionnaireTemplate $template, array $dto): QuestionnaireTemplate
    {
        if (isset($dto['sections'])) {
            $this->ensureIdsBelongToTemplate($template, $dto['sections']);
        }

        return DB::transaction(function () use ($template, $dto) {
            $template = $this->repository->update($template, [
                'title'       => $dto['title'] ?? $template->title,
                'description' => array_key_exists('description', $dto) ? $dto['description'] : $template->description,
            ]);

            if (isset($dto['sections'])) {
                $this->repository->replaceSections($template, $dto['sections']);
            }

            return $this->find($template->id);
        });
    }

    public function destroy(QuestionnaireTemplate $template): void
    {
        $this->repository->delete($template);
    }

    private function ensureIdsBelongToTemplate(QuestionnaireTemplate $template, array $sections): void
    {
        $validSectionIds  = array_flip($this->repository->sectionIdsForTemplate($template));
        $validQuestionIds = array_flip($this->repository->questionIdsForTemplate($template));
        $seenSectionIds   = [];
        $seenQuestionIds  = [];
        $errors           = [];

        foreach ($sections as $sIndex => $section) {
            if (isset($section['id'])) {
                $sectionId = (int) $section['id'];
                if (isset($seenSectionIds[$sectionId])) {
                    $errors["sections.{$sIndex}.id"] = 'Seção repetida no questionário.';
                } elseif (!isset($validSectionIds[$sectionId])) {
                    $errors["sections.{$sIndex}.id"] = 'A seção informada não pertence a este questionário.';
                }
                $seenSectionIds[$sectionId] = true;
            }

            foreach ($section['questions'] ?? [] as $qIndex => $question) {
                if (!isset($question['id'])) {
                    continue;
                }
                $questionId = (int) $question['id'];
                if (isset($seenQuestionIds[$questionId])) {
                    $errors["sections.{$sIndex}.questions.{$qIndex}.id"] = 'Pergunta repetida no questionário.';
                } elseif (!isset($validQuestionIds[$questionId])) {
                    $errors["sections.{$sIndex}.questions.{$qIndex}.id"] = 'A pergunta informada não pertence a este questionário.';
                }
                $seenQuestionIds[$questionId] = true;
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function dispatchEvent(object $event): void
    {
        DB::afterCommit(fn () => Event::dispatch($event));
    }
}
