<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAdminProgramRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'                       => ['sometimes', 'string', 'max:255'],
            'description'                 => ['nullable', 'string'],
            'physio_area_id'              => ['nullable', 'exists:physio_areas,id'],
            'physio_subarea_id'           => ['nullable', 'exists:physio_subareas,id'],
            'duration_minutes'            => ['nullable', 'integer', 'min:1'],
            'is_active'                   => ['boolean'],
            'groups'                      => ['nullable', 'array'],
            'groups.*.name'               => ['required_with:groups', 'string', 'max:255'],
            'groups.*.sort_order'         => ['integer', 'min:0'],
            'exercises'                   => ['nullable', 'array'],
            'exercises.*.exercise_id'     => ['required_with:exercises', 'exists:exercises,id'],
            'exercises.*.group_index'     => ['integer', 'min:0'],
            'exercises.*.days_of_week'    => ['nullable', 'array'],
            'exercises.*.days_of_week.*'  => ['integer', 'between:0,6'],
            'exercises.*.period'          => ['nullable', 'in:morning,afternoon,night'],
            'exercises.*.sets_min'        => ['nullable', 'integer', 'min:1'],
            'exercises.*.sets_max'        => ['nullable', 'integer', 'min:1'],
            'exercises.*.repetitions_min' => ['nullable', 'integer', 'min:1'],
            'exercises.*.repetitions_max' => ['nullable', 'integer', 'min:1'],
            'exercises.*.load_min'        => ['nullable', 'numeric', 'min:0'],
            'exercises.*.load_max'        => ['nullable', 'numeric', 'min:0'],
            'exercises.*.rest_time'       => ['nullable', 'integer', 'min:0'],
            'exercises.*.notes'           => ['nullable', 'string'],
            'exercises.*.sort_order'      => ['integer', 'min:0'],
        ];
    }
}
