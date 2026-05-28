<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientQuestionnaireRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'      => ['required', 'string', 'max:255'],
            'modality'   => ['required', 'in:presencial,remoto'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'    => 'O título é obrigatório.',
            'title.max'         => 'O título não pode ultrapassar 255 caracteres.',
            'modality.required' => 'A modalidade é obrigatória.',
            'modality.in'       => 'A modalidade deve ser presencial ou remoto.',
            'expires_at.date'   => 'A data de expiração deve ser uma data válida.',
            'expires_at.after'  => 'A data de expiração deve ser uma data futura.',
        ];
    }
}
