<?php

namespace Modules\Clinic\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Support\ReservedClinicSlugs;

class CreateClinicRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:255'],
            'email'         => ['required', 'email', 'unique:clinics,email'],
            'document'      => [
                'required',
                'string',
                'max:30',
                'unique:clinics,document',
                ReservedClinicSlugs::documentValidationClosure(
                    fn (): string => (string) $this->input('type_person', Clinic::TYPE_PERSON_JURIDICA),
                ),
            ],
            'type_person'   => ['required', 'string', 'in:' . Clinic::TYPE_PERSON_FISICA . ',' . Clinic::TYPE_PERSON_JURIDICA],
            'status'        => ['nullable', 'integer', 'in:' . Clinic::STATUS_ACTIVE . ',' . Clinic::STATUS_INACTIVE . ',' . Clinic::STATUS_CANCELLED],
            'slug'          => ['required', 'string', 'max:255', 'unique:clinics,slug', 'regex:' . ReservedClinicSlugs::REGEX],
            'zip_code'      => ['nullable', 'string', 'max:10'],
            'address'       => ['nullable', 'string', 'max:255'],
            'number'        => ['nullable', 'string', 'max:20'],
            'city'          => ['nullable', 'string', 'max:100'],
            'state'         => ['nullable', 'string', 'size:2'],
            'phone'         => ['nullable', 'string', 'max:30'],
            'plan_id'       => ['nullable', 'integer', 'exists:admin_plans,id'],
        ];
    }
}
