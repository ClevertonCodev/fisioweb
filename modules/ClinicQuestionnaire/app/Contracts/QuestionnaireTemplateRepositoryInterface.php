<?php

namespace Modules\ClinicQuestionnaire\Contracts;

use Illuminate\Support\Collection;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;

interface QuestionnaireTemplateRepositoryInterface
{
    public function listForClinic(int $clinicId): Collection;

    public function find(int $id): QuestionnaireTemplate;

    public function create(array $data): QuestionnaireTemplate;

    public function update(QuestionnaireTemplate $template, array $data): QuestionnaireTemplate;

    public function replaceSections(QuestionnaireTemplate $template, array $sections): void;

    /**
     * @return array<int, int>
     */
    public function sectionIdsForTemplate(QuestionnaireTemplate $template): array;

    /**
     * @return array<int, int>
     */
    public function questionIdsForTemplate(QuestionnaireTemplate $template): array;

    public function delete(QuestionnaireTemplate $template): void;

    public function existsActiveForClinic(int $clinicId, int $templateId): bool;
}
