<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Clinic\Models\TreatmentPlan;
use Modules\Clinic\Models\TreatmentPlanExercise;

class StoreTreatmentPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'                       => ['required', 'string', 'max:255'],
            'patient_id'                  => ['nullable', 'exists:patients,id'],
            'message'                     => ['nullable', 'string', 'max:600'],
            'physio_area_id'              => ['nullable', 'exists:admin_physio_areas,id'],
            'physio_subarea_id'           => ['nullable', 'exists:admin_physio_subareas,id'],
            'start_date'                  => ['nullable', 'date'],
            'end_date'                    => ['nullable', 'date', 'after_or_equal:start_date'],
            'duration_minutes'            => ['nullable', 'integer', 'min:1'],
            'status'                      => ['nullable', Rule::in(array_keys(TreatmentPlan::STATUSES))],
            'notes'                       => ['nullable', 'string'],
            'groups'                      => ['nullable', 'array'],
            'groups.*.name'               => ['required_with:groups', 'string', 'max:255'],
            'groups.*.sort_order'         => ['nullable', 'integer', 'min:0'],
            'exercises'                   => ['nullable', 'array'],
            'exercises.*.exercise_id'     => ['required_with:exercises', 'exists:admin_exercises,id'],
            'exercises.*.group_index'     => ['nullable', 'integer', 'min:0'],
            'exercises.*.days_of_week'    => ['nullable', 'array'],
            'exercises.*.period'          => ['nullable', Rule::in(array_keys(TreatmentPlanExercise::PERIODS))],
            'exercises.*.sets_min'        => ['nullable', 'integer', 'min:1', 'max:100'],
            'exercises.*.sets_max'        => ['nullable', 'integer', 'min:1', 'max:100'],
            'exercises.*.repetitions_min' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'exercises.*.repetitions_max' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'exercises.*.load_min'        => ['nullable', 'numeric', 'min:0'],
            'exercises.*.load_max'        => ['nullable', 'numeric', 'min:0'],
            'exercises.*.rest_time'       => ['nullable', 'string', 'max:50'],
            'exercises.*.notes'           => ['nullable', 'string'],
            'exercises.*.sort_order'      => ['nullable', 'integer', 'min:0'],
        ];
    }
}
