<?php

namespace Modules\ClinicQuestionnaire\Contracts;

use Illuminate\Support\Collection;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;

interface QuestionnaireTemplateServiceInterface
{
    public function listForClinic(int $clinicId): Collection;

    public function find(int $id): QuestionnaireTemplate;

    public function create(array $dto, int $clinicId): QuestionnaireTemplate;

    public function update(QuestionnaireTemplate $template, array $dto): QuestionnaireTemplate;

    public function destroy(QuestionnaireTemplate $template): void;
}
