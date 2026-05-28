<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEvolutionTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                              => ['required', 'string', 'max:255'],
            'description'                       => ['nullable', 'string', 'max:2000'],
            'sections'                          => ['required', 'array', 'min:1'],
            'sections.*.title'                  => ['required', 'string', 'max:255'],
            'sections.*.sort_order'             => ['required', 'integer', 'min:0'],
            'sections.*.items'                  => ['required', 'array', 'min:1'],
            'sections.*.items.*.label'          => ['required', 'string', 'max:500'],
            'sections.*.items.*.print_text'     => ['required', 'string', 'max:2000'],
            'sections.*.items.*.has_free_text'  => ['nullable', 'boolean'],
            'sections.*.items.*.free_text_placeholder' => ['nullable', 'string', 'max:255'],
            'sections.*.items.*.sort_order'     => ['required', 'integer', 'min:0'],
        ];
    }
}
