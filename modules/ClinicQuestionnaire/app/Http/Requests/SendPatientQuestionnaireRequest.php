<?php

namespace Modules\ClinicQuestionnaire\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Modules\ClinicQuestionnaire\Contracts\QuestionnaireTemplateRepositoryInterface;

class SendPatientQuestionnaireRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $clinicId   = Auth::guard('clinic')->user()->clinic_id;
        $repository = app(QuestionnaireTemplateRepositoryInterface::class);

        return [
            'questionnaire_template_id' => [
                'required',
                'integer',
                function ($attribute, $value, $fail) use ($clinicId, $repository) {
                    if (!$repository->existsActiveForClinic((int) $clinicId, (int) $value)) {
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
