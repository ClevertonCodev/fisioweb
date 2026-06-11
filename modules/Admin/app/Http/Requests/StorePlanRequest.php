<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255', 'unique:admin_plans,name'],
            'type_charge' => ['required', 'string', Rule::in(['por_usuario', 'fixo'])],
            'value_month' => ['required', 'numeric', 'min:0'],
            'value_year'  => ['required', 'numeric', 'min:0'],
        ];
    }
}
