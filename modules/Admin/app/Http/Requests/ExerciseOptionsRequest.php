<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExerciseOptionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'exercise_id' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function exerciseId(): ?int
    {
        $exerciseId = $this->validated('exercise_id');

        return is_null($exerciseId) ? null : (int) $exerciseId;
    }
}
