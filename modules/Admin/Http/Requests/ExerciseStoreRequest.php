<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Admin\Models\Exercise;

class ExerciseStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'physio_area_id' => ['required', 'exists:physio_areas,id'],
            'physio_subarea_id' => ['nullable', 'exists:physio_subareas,id'],
            'body_region_id' => ['required', 'exists:body_regions,id'],
            'therapeutic_goal' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'audio_description' => ['nullable', 'string'],
            'difficulty_level' => ['required', Rule::in(array_keys(Exercise::DIFFICULTIES))],
            'muscle_group' => ['nullable', 'string', 'max:255'],
            'movement_type' => ['nullable', 'string', 'max:255'],
            'movement_form' => ['nullable', Rule::in(array_keys(Exercise::MOVEMENT_FORMS))],
            'kinetic_chain' => ['nullable', 'string', 'max:255'],
            'decubitus' => ['nullable', 'string', 'max:255'],
            'indications' => ['nullable', 'string'],
            'contraindications' => ['nullable', 'string'],
            'frequency' => ['nullable', 'string', 'max:255'],
            'sets' => ['nullable', 'integer', 'min:1', 'max:100'],
            'repetitions' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'rest_time' => ['nullable', 'integer', 'min:0', 'max:600'],
            'clinical_notes' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'O nome do exercício é obrigatório.',
            'physio_area_id.required' => 'A área da fisioterapia é obrigatória.',
            'physio_area_id.exists' => 'A área selecionada não existe.',
            'physio_subarea_id.exists' => 'A subárea selecionada não existe.',
            'body_region_id.required' => 'A região do corpo é obrigatória.',
            'body_region_id.exists' => 'A região do corpo selecionada não existe.',
            'difficulty_level.required' => 'O nível de dificuldade é obrigatório.',
            'difficulty_level.in' => 'Nível de dificuldade inválido.',
            'movement_form.in' => 'Forma de movimento inválida.',
            'sets.min' => 'O número de séries deve ser pelo menos 1.',
            'repetitions.min' => 'O número de repetições deve ser pelo menos 1.',
            'rest_time.min' => 'O tempo de descanso não pode ser negativo.',
            'rest_time.max' => 'O tempo de descanso não pode exceder 600 segundos.',
        ];
    }
}
