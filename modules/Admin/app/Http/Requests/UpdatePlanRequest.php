<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'name'        => ['required', 'string', 'max:255', Rule::unique('plans', 'name')->ignore($id)],
            'type_charge' => ['required', 'string', Rule::in(['por_usuario', 'fixo'])],
            'value_month' => ['required', 'numeric', 'min:0'],
            'value_year'  => ['required', 'numeric', 'min:0'],
        ];
    }
}
