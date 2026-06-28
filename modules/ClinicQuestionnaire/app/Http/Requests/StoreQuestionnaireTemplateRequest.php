<?php

namespace Modules\ClinicQuestionnaire\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuestionnaireTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'                              => ['required', 'string', 'max:255'],
            'description'                        => ['nullable', 'string'],
            'sections'                           => ['required', 'array', 'min:1'],
            'sections.*.title'                   => ['required', 'string', 'max:255'],
            'sections.*.sort_order'              => ['nullable', 'integer', 'min:0'],
            'sections.*.questions'               => ['required', 'array', 'min:1'],
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
            'title.required'                        => 'O título é obrigatório.',
            'sections.required'                     => 'O template deve ter ao menos uma seção.',
            'sections.*.title.required'             => 'Cada seção deve ter um título.',
            'sections.*.questions.required'         => 'Cada seção deve ter ao menos uma pergunta.',
            'sections.*.questions.*.label.required' => 'Cada pergunta deve ter um enunciado.',
            'sections.*.questions.*.type.required'  => 'Cada pergunta deve ter um tipo.',
            'sections.*.questions.*.type.in'        => 'Tipo de pergunta inválido.',
        ];
    }
}
