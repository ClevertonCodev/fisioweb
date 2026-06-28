<?php

namespace Modules\Admin\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Admin\Contracts\Public\AssessmentTemplateReadServiceInterface;
use Modules\Admin\Models\AdminAssessmentTemplate;

class AssessmentTemplateReadService implements AssessmentTemplateReadServiceInterface
{
    public function findActiveForValidation(int $templateId): ?array
    {
        $template = AdminAssessmentTemplate::query()
            ->active()
            ->with(['sections.fields.options'])
            ->find($templateId);

        if (is_null($template)) {
            return null;
        }

        return [
            'id'       => (int) $template->id,
            'sections' => $template->sections->map(function ($section): array {
                return [
                    'id'     => (int) $section->id,
                    'fields' => $section->fields->map(function ($field): array {
                        return [
                            'id'      => (int) $field->id,
                            'type'    => (string) $field->field_type,
                            'options' => $field->options->map(fn ($option): array => ['id' => (int) $option->id])->values()->all(),
                        ];
                    })->values()->all(),
                ];
            })->values()->all(),
        ];
    }

    public function listActive(?string $search, int $perPage): LengthAwarePaginator
    {
        $query = AdminAssessmentTemplate::query()
            ->withCount('fields')
            ->where('is_active', true);

        if (!empty($search)) {
            $query->where('name', 'like', '%' . $search . '%');
        }

        return $query->orderBy('sort_order')->orderBy('name')->paginate($perPage);
    }

    public function findActiveForShow(int $id): ?array
    {
        $template = AdminAssessmentTemplate::query()
            ->with(['createdBy', 'sections.fields.options'])
            ->withCount('fields')
            ->where('is_active', true)
            ->find($id);

        return is_null($template) ? null : $template->toArray();
    }
}
