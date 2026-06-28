<?php

namespace Modules\ClinicQuestionnaire\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
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

    private function dispatchEvent(object $event): void
    {
        DB::afterCommit(fn () => Event::dispatch($event));
    }
}
