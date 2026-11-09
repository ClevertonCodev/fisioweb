<?php

namespace Modules\ClinicalRecord\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateEvolutionTextRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'checked_item_ids'           => ['nullable', 'array'],
            'checked_item_ids.*'         => ['integer'],
            'free_text_values'           => ['nullable', 'array'],
            'free_text_values.*.item_id' => ['required_with:free_text_values', 'integer'],
            'free_text_values.*.value'   => ['required_with:free_text_values', 'string', 'max:1000'],
        ];
    }
}
