<?php

namespace Modules\Admin\Http\Requests;

use App\Helpers\ValidationHelper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Clinic\Models\Clinic;

class UpdateClinicRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Clinic $clinic */
        $clinic = $this->route('clinic');
        $id     = $clinic->id;

        return [
            'name'        => ['required', 'string', 'max:255'],
            'document'    => [
                'required',
                'string',
                'max:255',
                Rule::unique('clinics', 'document')->ignore($id),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $typePerson = $this->input('type_person');
                    if ($typePerson === 'fisica' && !ValidationHelper::validateCpf($value)) {
                        $fail('O CPF informado é inválido.');
                    }
                    if ($typePerson === 'juridica' && !ValidationHelper::validateCnpj($value)) {
                        $fail('O CNPJ informado é inválido.');
                    }
                },
            ],
            'type_person' => ['required', 'string', Rule::in(['fisica', 'juridica'])],
            'status'      => ['required', Rule::in(['1', '0', '-1', 1, 0, -1])],
            'email'       => ['required', 'email', 'max:255', Rule::unique('clinics', 'email')->ignore($id)],
            'phone'       => ['required', 'string', 'max:20'],
            'slug'        => ['nullable', 'string', 'max:255', Rule::unique('clinics', 'slug')->ignore($id)],
            'zip_code'    => ['required', 'string', 'max:10'],
            'address'     => ['required', 'string', 'max:255'],
            'number'      => ['required', 'string', 'max:20'],
            'city'        => ['required', 'string', 'max:100'],
            'state'       => ['required', 'string', 'size:2'],
            'plan_id'     => ['nullable'],
        ];
    }

    public function messages(): array
    {
        return (new StoreClinicRequest)->messages();
    }
}
