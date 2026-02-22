<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PatientUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'              => ['required', 'string', 'max:255'],
            'cpf'               => ['nullable', 'string', 'max:14'],
            'email'             => ['nullable', 'email', 'max:255'],
            'phone'             => ['nullable', 'string', 'max:20'],
            'gender'            => ['nullable', 'string', 'max:50'],
            'biological_sex'    => ['nullable', 'string', 'max:50'],
            'birth_date'        => ['nullable', 'date'],
            'marital_status'    => ['nullable', 'string', 'max:50'],
            'education'         => ['nullable', 'string', 'max:100'],
            'profession'        => ['nullable', 'string', 'max:100'],
            'emergency_contact' => ['nullable', 'string', 'max:255'],
            'caregiver_contact' => ['nullable', 'string', 'max:255'],
            'insurance'         => ['nullable', 'string', 'max:100'],
            'insurance_number'  => ['nullable', 'string', 'max:50'],
            'address'           => ['nullable', 'string', 'max:255'],
            'city'              => ['nullable', 'string', 'max:100'],
            'state'             => ['nullable', 'string', 'size:2'],
            'zip_code'          => ['nullable', 'string', 'max:10'],
            'referral_source'   => ['nullable', 'string', 'max:100'],
            'is_active'         => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'   => 'O nome do paciente é obrigatório.',
            'name.max'        => 'O nome não pode ter mais de 255 caracteres.',
            'email.email'     => 'Informe um e-mail válido.',
            'birth_date.date' => 'Data de nascimento inválida.',
            'state.size'      => 'O estado deve ter exatamente 2 caracteres (ex: SP).',
        ];
    }
}
