<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Admin\Models\Feature;

class StoreFeatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $allowedKeys = array_keys(Feature::ALLOWED_KEYS);
        $types       = array_keys(Feature::TYPES);

        return [
            'key'            => ['required', 'string', 'max:255', 'unique:features,key', Rule::in($allowedKeys)],
            'name'           => ['required', 'string', 'max:255'],
            'value_isolated' => ['nullable', 'numeric', 'min:0'],
            'type'           => ['required', 'string', Rule::in($types)],
        ];
    }
}
