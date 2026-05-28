<?php

namespace Modules\Clinic\Http\Requests\Admin;

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
        $id = $this->route('id');

        return [
            'name'          => ['nullable', 'string', 'max:255'],
            'email'         => ['nullable', 'email', Rule::unique('clinics', 'email')->ignore($id)],
            'document'      => [
                'nullable',
                'string',
                'max:30',
                Rule::unique('clinics', 'document')->ignore($id),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value === null || $value === '') {
                        return;
                    }
                    $type = $this->input('type_person', Clinic::TYPE_PERSON_JURIDICA);
                    if ($type === Clinic::TYPE_PERSON_JURIDICA && !ValidationHelper::validateCnpj($value)) {
                        $fail('O campo documento deve ser um CNPJ válido.');
                    }
                    if ($type === Clinic::TYPE_PERSON_FISICA && !ValidationHelper::validateCpf($value)) {
                        $fail('O campo documento deve ser um CPF válido.');
                    }
                },
            ],
            'type_person'   => ['nullable', 'string', 'in:' . Clinic::TYPE_PERSON_FISICA . ',' . Clinic::TYPE_PERSON_JURIDICA],
            'status'        => ['nullable', 'integer', 'in:' . Clinic::STATUS_ACTIVE . ',' . Clinic::STATUS_INACTIVE . ',' . Clinic::STATUS_CANCELLED],
            'slug'          => ['nullable', 'string', 'max:255', Rule::unique('clinics', 'slug')->ignore($id), 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'zip_code'      => ['nullable', 'string', 'max:10'],
            'address'       => ['nullable', 'string', 'max:255'],
            'number'        => ['nullable', 'string', 'max:20'],
            'city'          => ['nullable', 'string', 'max:100'],
            'state'         => ['nullable', 'string', 'size:2'],
            'phone'         => ['nullable', 'string', 'max:30'],
            'plan_id'       => ['nullable', 'integer', 'exists:plans,id'],
        ];
    }
}
