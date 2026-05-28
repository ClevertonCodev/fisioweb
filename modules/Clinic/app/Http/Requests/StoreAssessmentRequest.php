<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssessmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'admin_assessment_template_id' => [
                'required',
                'integer',
                Rule::exists('admin_assessment_templates', 'id')
                    ->where(fn ($q) => $q->where('is_active', true)->whereNull('deleted_at')),
            ],
            'answers'                      => ['nullable', 'array'],
            'answers.*.field_id'           => ['required_with:answers', 'integer', 'exists:admin_assessment_fields,id'],
            'answers.*.value'              => ['nullable', 'string', 'max:5000'],
            'answer_options'               => ['nullable', 'array'],
            'answer_options.*.field_id'    => ['required_with:answer_options', 'integer', 'exists:admin_assessment_fields,id'],
            'answer_options.*.option_id'   => ['required_with:answer_options', 'integer', 'exists:admin_assessment_field_options,id'],
        ];
    }
}
