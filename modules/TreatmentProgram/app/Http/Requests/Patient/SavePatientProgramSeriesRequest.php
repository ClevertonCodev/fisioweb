<?php

namespace Modules\TreatmentProgram\Http\Requests\Patient;

use Illuminate\Foundation\Http\FormRequest;
use Modules\TreatmentProgram\DTOs\PatientProgram\PatientProgramSeriesItemData;
use Modules\TreatmentProgram\DTOs\PatientProgram\SavePatientProgramSeriesData;

class SavePatientProgramSeriesRequest extends FormRequest
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
            'exercise_id'              => ['required', 'integer'],
            'series'                   => ['required', 'array', 'min:1'],
            'series.*.count'           => ['nullable', 'integer', 'min:0'],
            'series.*.weight_value'    => ['nullable', 'string', 'max:50'],
            'series.*.weight_unit'     => ['nullable', 'string', 'max:20'],
            'series.*.is_bodyweight'   => ['nullable', 'boolean'],
        ];
    }

    public function toDto(): SavePatientProgramSeriesData
    {
        $series = collect($this->input('series', []))->map(function (array $item) {
            return new PatientProgramSeriesItemData(
                count: isset($item['count']) ? (int) $item['count'] : null,
                weightValue: $item['weight_value'] ?? null,
                weightUnit: $item['weight_unit'] ?? null,
                isBodyweight: (bool) ($item['is_bodyweight'] ?? false),
            );
        })->all();

        return new SavePatientProgramSeriesData(
            exerciseId: (int) $this->input('exercise_id'),
            series: $series,
        );
    }
}
