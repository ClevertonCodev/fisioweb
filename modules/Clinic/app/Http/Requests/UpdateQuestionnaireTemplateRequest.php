<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateQuestionnaireTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'                              => ['sometimes', 'string', 'max:255'],
            'description'                        => ['nullable', 'string'],
            'sections'                           => ['sometimes', 'array', 'min:1'],
            'sections.*.title'                   => ['required_with:sections', 'string', 'max:255'],
            'sections.*.sort_order'              => ['nullable', 'integer', 'min:0'],
            'sections.*.questions'               => ['required_with:sections', 'array', 'min:1'],
            'sections.*.questions.*.label'       => ['required', 'string', 'max:500'],
            'sections.*.questions.*.type'        => ['required', 'in:multiple_choice,checkbox,scale,text'],
            'sections.*.questions.*.options'     => ['nullable', 'array'],
            'sections.*.questions.*.options.*'   => ['string'],
            'sections.*.questions.*.scale_min'   => ['nullable', 'integer', 'min:0'],
            'sections.*.questions.*.scale_max'   => ['nullable', 'integer', 'min:1'],
            'sections.*.questions.*.required'    => ['nullable', 'boolean'],
            'sections.*.questions.*.sort_order'  => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'sections.*.title.required_with'            => 'Cada seção deve ter um título.',
            'sections.*.questions.required_with'        => 'Cada seção deve ter ao menos uma pergunta.',
            'sections.*.questions.*.label.required'     => 'Cada pergunta deve ter um enunciado.',
            'sections.*.questions.*.type.required'      => 'Cada pergunta deve ter um tipo.',
            'sections.*.questions.*.type.in'            => 'Tipo de pergunta inválido.',
        ];
    }
}
