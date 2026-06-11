<?php

namespace Modules\Clinic\Http\Requests;

use App\Helpers\ValidationHelper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StorePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        return [
            'name'              => ['required', 'string', 'max:255'],
            'is_foreign'        => ['nullable', 'boolean'],
            'cpf'               => [
                'nullable', 'string', 'max:14',
                'required_unless:is_foreign,true',
                Rule::unique('patients')->where('clinic_id', $clinicId),
            ],
            'email'             => [
                'required', 'email', 'max:255',
                Rule::unique('patients')->where('clinic_id', $clinicId),
            ],
            'phone'             => ['required', 'string', 'max:20'],
            'birth_date'        => ['required', 'date'],
            'gender'            => ['nullable', 'string', 'max:50'],
            'biological_sex'    => ['nullable', 'string', 'max:20'],
            'marital_status'    => ['nullable', 'string', 'max:50'],
            'education'         => ['nullable', 'string', 'max:100'],
            'profession'        => ['nullable', 'string', 'max:100'],
            'emergency_contact' => ['nullable', 'string', 'max:255'],
            'caregiver_contact' => ['nullable', 'string', 'max:255'],
            'insurance'         => ['nullable', 'string', 'max:100'],
            'insurance_number'  => ['nullable', 'string', 'max:50'],
            'address'           => ['nullable', 'string', 'max:255'],
            'neighborhood'      => ['nullable', 'string', 'max:100'],
            'city'              => ['nullable', 'string', 'max:100'],
            'state'             => ['nullable', 'string', 'size:2'],
            'zip_code'          => ['nullable', 'string', 'max:10'],
            'referral_source'   => ['nullable', 'string', 'max:100'],
            'apelido'           => ['nullable', 'string', 'max:100'],
            'use_apelido'       => ['nullable', 'boolean'],
            'is_active'         => ['nullable', 'boolean'],
            'status'            => ['nullable', 'string', 'max:50'],
            'diagnosis'         => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator(\Illuminate\Contracts\Validation\Validator $validator): void
    {
        $validator->after(function ($v) {
            $isForeign = filter_var($this->input('is_foreign'), FILTER_VALIDATE_BOOLEAN);
            $cpf       = $this->input('cpf');

            if (!$isForeign && $cpf && !ValidationHelper::validateCpf($cpf)) {
                $v->errors()->add('cpf', 'CPF inválido.');
            }
        });
    }
}
