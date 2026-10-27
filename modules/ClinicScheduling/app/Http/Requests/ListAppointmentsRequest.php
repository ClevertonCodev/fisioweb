<?php

namespace Modules\ClinicScheduling\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListAppointmentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'patient_id' => ['sometimes', 'integer', 'min:1'],
        ];
    }
}
