<?php

namespace Modules\TreatmentProgram\Http\Requests\Patient;

use Illuminate\Foundation\Http\FormRequest;
use Modules\TreatmentProgram\DTOs\PatientProgram\UpdateUnfinishedExercisesData;

class UpdateUnfinishedExercisesRequest extends FormRequest
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
            'unfinished_exercise_ids'   => ['required', 'array'],
            'unfinished_exercise_ids.*' => ['integer'],
        ];
    }

    public function toDto(): UpdateUnfinishedExercisesData
    {
        $ids = collect($this->input('unfinished_exercise_ids', []))
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        return new UpdateUnfinishedExercisesData($ids);
    }
}
