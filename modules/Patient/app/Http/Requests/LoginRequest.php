<?php

namespace Modules\Patient\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cpf'       => ['required', 'string'],
            'clinic_id' => ['required', 'integer', 'exists:clinics,id'],
        ];
    }
}
