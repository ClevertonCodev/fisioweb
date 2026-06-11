<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AnswerPatientQuestionnaireRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'answers'                   => ['required', 'array', 'min:1'],
            'answers.*.question_id'     => ['required', 'integer', 'exists:clinic_questionnaire_questions,id'],
            'answers.*.answer'          => ['required'],
        ];
    }

    public function messages(): array
    {
        return [
            'answers.required'                  => 'As respostas são obrigatórias.',
            'answers.*.question_id.required'    => 'Cada resposta deve referenciar uma pergunta.',
            'answers.*.question_id.exists'      => 'Pergunta não encontrada.',
            'answers.*.answer.required'         => 'Cada pergunta deve ter uma resposta.',
        ];
    }
}
