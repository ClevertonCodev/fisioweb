<?php

namespace Modules\ClinicalRecord\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssessmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'answers'                      => ['nullable', 'array'],
            'answers.*.field_id'           => ['required_with:answers', 'integer', 'exists:admin_assessment_fields,id'],
            'answers.*.value'              => ['nullable', 'string', 'max:5000'],
            'answer_options'               => ['nullable', 'array'],
            'answer_options.*.field_id'    => ['required_with:answer_options', 'integer', 'exists:admin_assessment_fields,id'],
            'answer_options.*.option_id'   => ['required_with:answer_options', 'integer', 'exists:admin_assessment_field_options,id'],
        ];
    }
}
