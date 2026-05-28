<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Models\QuestionnaireTemplate;

class SendPatientQuestionnaireRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        return [
            'questionnaire_template_id' => [
                'required',
                'integer',
                function ($attribute, $value, $fail) use ($clinicId) {
                    $exists = QuestionnaireTemplate::query()
                        ->forClinic($clinicId)
                        ->active()
                        ->where('id', $value)
                        ->exists();

                    if (! $exists) {
                        $fail('Template de questionário não encontrado.');
                    }
                },
            ],
            'modality'   => ['required', 'in:presencial,remoto'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ];
    }

    public function messages(): array
    {
        return [
            'questionnaire_template_id.required' => 'O template é obrigatório.',
            'modality.required'                  => 'A modalidade é obrigatória.',
            'modality.in'                        => 'A modalidade deve ser presencial ou remoto.',
            'expires_at.date'                    => 'A data de expiração deve ser uma data válida.',
            'expires_at.after'                   => 'A data de expiração deve ser uma data futura.',
        ];
    }
}
