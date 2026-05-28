<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Admin\Models\Exercise;

class StoreExerciseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'               => ['required', 'string', 'max:255'],
            'physio_area_id'     => ['required', 'exists:physio_areas,id'],
            'physio_subarea_id'  => ['nullable', 'exists:physio_subareas,id'],
            'body_region_id'     => ['required', 'exists:body_regions,id'],
            'therapeutic_goal'   => ['nullable', 'string', 'max:255'],
            'description'        => ['nullable', 'string'],
            'audio_description'  => ['nullable', 'string'],
            'difficulty_level'   => ['required', Rule::in(array_keys(Exercise::DIFFICULTIES))],
            'muscle_group'       => ['nullable', 'string', 'max:255'],
            'movement_type'      => ['nullable', 'string', 'max:255'],
            'movement_form'      => ['nullable', Rule::in(array_keys(Exercise::MOVEMENT_FORMS))],
            'kinetic_chain'      => ['nullable', 'string', 'max:255'],
            'decubitus'          => ['nullable', 'string', 'max:255'],
            'indications'        => ['nullable', 'string'],
            'contraindications'  => ['nullable', 'string'],
            'frequency'          => ['nullable', 'string', 'max:255'],
            'sets'               => ['nullable', 'integer', 'min:1', 'max:100'],
            'repetitions'        => ['nullable', 'integer', 'min:1', 'max:1000'],
            'rest_time'          => ['nullable', 'integer', 'min:0', 'max:600'],
            'clinical_notes'     => ['nullable', 'string'],
            'video_id'           => ['nullable', 'integer', 'exists:videos,id'],
            'is_active'          => ['nullable', 'boolean'],
        ];
    }
}
