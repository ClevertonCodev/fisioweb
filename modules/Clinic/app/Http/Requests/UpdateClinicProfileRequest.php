<?php

namespace Modules\Clinic\Http\Requests;

use App\Helpers\ValidationHelper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;

class UpdateClinicProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('clinic');

        return $user instanceof ClinicUser && $user->isAdmin() && $user->isMaster();
    }

    public function rules(): array
    {
        $clinicId = $this->user('clinic')?->clinic_id;

        return [
            'name'        => ['required', 'string', 'max:255'],
            'email'       => ['required', 'email', Rule::unique('clinics', 'email')->ignore($clinicId)],
            'document'    => [
                'required',
                'string',
                'max:30',
                Rule::unique('clinics', 'document')->ignore($clinicId),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $type = $this->input('type_person', Clinic::TYPE_PERSON_JURIDICA);
                    if ($type === Clinic::TYPE_PERSON_JURIDICA && !ValidationHelper::validateCnpj($value)) {
                        $fail('O campo documento deve ser um CNPJ válido.');
                    }
                    if ($type === Clinic::TYPE_PERSON_FISICA && !ValidationHelper::validateCpf($value)) {
                        $fail('O campo documento deve ser um CPF válido.');
                    }
                },
            ],
            'type_person' => ['required', 'string', 'in:' . Clinic::TYPE_PERSON_FISICA . ',' . Clinic::TYPE_PERSON_JURIDICA],
            'status'      => ['required', 'integer', 'in:' . Clinic::STATUS_ACTIVE . ',' . Clinic::STATUS_INACTIVE . ',' . Clinic::STATUS_CANCELLED],
            'zip_code'    => ['nullable', 'string', 'max:10'],
            'address'     => ['nullable', 'string', 'max:255'],
            'number'      => ['nullable', 'string', 'max:20'],
            'city'        => ['nullable', 'string', 'max:100'],
            'state'       => ['nullable', 'string', 'size:2'],
            'phone'       => ['nullable', 'string', 'max:30'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('typePerson') && !$this->has('type_person')) {
            $this->merge([
                'type_person' => $this->input('typePerson') === 'PJ'
                    ? Clinic::TYPE_PERSON_JURIDICA
                    : Clinic::TYPE_PERSON_FISICA,
            ]);
        }

        if ($this->has('zipCode') && !$this->has('zip_code')) {
            $this->merge(['zip_code' => $this->input('zipCode')]);
        }
    }
}
