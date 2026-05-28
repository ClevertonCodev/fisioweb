<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Admin\Models\Feature;

class UpdateFeatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'key'            => ['required', 'string', 'max:255', Rule::unique('features', 'key')->ignore($id), Rule::in(array_keys(Feature::ALLOWED_KEYS))],
            'name'           => ['required', 'string', 'max:255'],
            'value_isolated' => ['nullable', 'numeric', 'min:0'],
            'type'           => ['required', 'string', Rule::in(array_keys(Feature::TYPES))],
        ];
    }
}
