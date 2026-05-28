<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEvolutionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'                         => ['required', 'string', 'max:255'],
            'checked_item_ids'              => ['nullable', 'array'],
            'checked_item_ids.*'            => ['integer', 'exists:evolution_template_items,id'],
            'free_text_values'              => ['nullable', 'array'],
            'free_text_values.*.item_id'    => ['required_with:free_text_values', 'integer'],
            'free_text_values.*.value'      => ['required_with:free_text_values', 'string', 'max:1000'],
            'generated_text'                => ['nullable', 'string', 'max:50000'],
            'notes'                         => ['nullable', 'string', 'max:10000'],
        ];
    }
}
