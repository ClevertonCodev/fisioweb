<?php

namespace Modules\TreatmentProgram\Http\Requests\Patient;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\TreatmentProgram\DTOs\PatientProgram\SubmitPatientProgramFeedbackData;
use Modules\TreatmentProgram\Enums\SatisfactionRating;

class SubmitPatientProgramFeedbackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'pain'             => ['nullable', 'integer', 'min:0', 'max:10'],
            'pain_notes'       => ['nullable', 'string', 'max:2000'],
            'difficulty'       => ['nullable', 'integer', 'min:0', 'max:10'],
            'difficulty_notes' => ['nullable', 'string', 'max:2000'],
            'rating'           => ['nullable', 'string', Rule::in(SatisfactionRating::values())],
            'rating_notes'     => ['nullable', 'string', 'max:2000'],
            'execution_id'     => ['nullable', 'integer'],
        ];
    }

    public function toDto(): SubmitPatientProgramFeedbackData
    {
        return new SubmitPatientProgramFeedbackData(
            pain: $this->has('pain') ? (int) $this->input('pain') : null,
            painNotes: $this->input('pain_notes'),
            difficulty: $this->has('difficulty') ? (int) $this->input('difficulty') : null,
            difficultyNotes: $this->input('difficulty_notes'),
            rating: $this->input('rating'),
            ratingNotes: $this->input('rating_notes'),
            executionId: $this->filled('execution_id') ? (int) $this->input('execution_id') : null,
        );
    }
}
