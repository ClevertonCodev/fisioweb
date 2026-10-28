<?php

namespace Modules\TreatmentProgram\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListTreatmentPlansRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'patient_id'     => ['nullable', 'integer'],
            'physio_area_id' => ['nullable', 'integer'],
            'per_page'       => ['nullable', 'integer', 'min:1', 'max:200'],
        ];
    }
}
