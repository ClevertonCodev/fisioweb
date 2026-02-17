<?php

namespace Modules\Admin\Http\Requests;

use App\Helpers\ValidationHelper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Clinic\Models\Clinic;

class StoreClinicRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'document'    => [
                'required',
                'string',
                'max:255',
                'unique:clinics,document',
                $this->documentRule(),
            ],
            'type_person' => ['required', 'string', Rule::in([Clinic::TYPE_PERSON_FISICA, Clinic::TYPE_PERSON_JURIDICA])],
            'status'      => ['required', Rule::in(['1', '0', '-1', 1, 0, -1])],
            'email'       => [
                'required',
                'email',
                'max:255',
                'unique:clinics,email',
                'unique:clinic_users,email',
            ],
            'phone'       => ['required', 'string', 'max:20'],
            'slug'        => ['nullable', 'string', 'max:255', 'unique:clinics,slug'],
            'zip_code'    => ['required', 'string', 'max:10'],
            'address'     => ['required', 'string', 'max:255'],
            'number'      => ['required', 'string', 'max:20'],
            'city'        => ['required', 'string', 'max:100'],
            'state'       => ['required', 'string', 'size:2'],
            'plan_id'     => ['nullable'],
        ];
    }

    protected function documentRule(): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail): void {
            $typePerson = $this->input('type_person');
            if ($typePerson === Clinic::TYPE_PERSON_FISICA && !ValidationHelper::validateCpf($value)) {
                $fail('O CPF informado é inválido.');
            }
            if ($typePerson === Clinic::TYPE_PERSON_JURIDICA && !ValidationHelper::validateCnpj($value)) {
                $fail('O CNPJ informado é inválido.');
            }
        };
    }

    public function messages(): array
    {
        return [
            'name.required'        => 'O nome da clínica é obrigatório.',
            'document.required'    => 'O documento é obrigatório.',
            'document.unique'      => 'Este documento já está cadastrado.',
            'type_person.required' => 'O tipo de pessoa é obrigatório.',
            'type_person.in'       => 'Tipo de pessoa inválido.',
            'status.required'      => 'O status é obrigatório.',
            'email.required'       => 'O e-mail é obrigatório.',
            'email.unique'         => 'Este e-mail já está em uso.',
            'phone.required'       => 'O telefone é obrigatório.',
            'slug.unique'          => 'Esta URL já está em uso.',
            'zip_code.required'    => 'O CEP é obrigatório.',
            'address.required'     => 'O endereço é obrigatório.',
            'number.required'      => 'O número é obrigatório.',
            'city.required'        => 'A cidade é obrigatória.',
            'state.required'       => 'O estado (UF) é obrigatório.',
            'state.size'           => 'Informe a UF com 2 caracteres.',
        ];
    }
}
