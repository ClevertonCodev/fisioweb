<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Clinic\Models\TreatmentPlan;
use Modules\Clinic\Models\TreatmentPlanExercise;

class TreatmentPlanStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'             => ['required', 'string', 'max:255'],
            'patient_id'        => ['nullable', 'exists:patients,id'],
            'message'           => ['nullable', 'string', 'max:600'],
            'physio_area_id'    => ['nullable', 'exists:physio_areas,id'],
            'physio_subarea_id' => ['nullable', 'exists:physio_subareas,id'],
            'start_date'        => ['nullable', 'date'],
            'end_date'          => ['nullable', 'date', 'after_or_equal:start_date'],
            'duration_minutes'  => ['nullable', 'integer', 'min:1'],
            'status'            => ['nullable', Rule::in(array_keys(TreatmentPlan::STATUSES))],
            'notes'             => ['nullable', 'string'],

            'groups'              => ['nullable', 'array'],
            'groups.*.name'       => ['required_with:groups', 'string', 'max:255'],
            'groups.*.sort_order' => ['nullable', 'integer', 'min:0'],

            'exercises'                           => ['nullable', 'array'],
            'exercises.*.exercise_id'             => ['required_with:exercises', 'exists:exercises,id'],
            'exercises.*.treatment_plan_group_id' => ['nullable', 'integer'],
            'exercises.*.days_of_week'            => ['nullable', 'array'],
            'exercises.*.days_of_week.*'          => ['string', Rule::in(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'all'])],
            'exercises.*.period'                  => ['nullable', Rule::in(array_keys(TreatmentPlanExercise::PERIODS))],
            'exercises.*.sets_min'                => ['nullable', 'integer', 'min:1', 'max:100'],
            'exercises.*.sets_max'                => ['nullable', 'integer', 'min:1', 'max:100'],
            'exercises.*.repetitions_min'         => ['nullable', 'integer', 'min:1', 'max:1000'],
            'exercises.*.repetitions_max'         => ['nullable', 'integer', 'min:1', 'max:1000'],
            'exercises.*.load_min'                => ['nullable', 'numeric', 'min:0'],
            'exercises.*.load_max'                => ['nullable', 'numeric', 'min:0'],
            'exercises.*.rest_time'               => ['nullable', 'string', 'max:50'],
            'exercises.*.notes'                   => ['nullable', 'string'],
            'exercises.*.sort_order'              => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'                        => 'O título do plano é obrigatório.',
            'title.max'                             => 'O título não pode ter mais de 255 caracteres.',
            'patient_id.exists'                     => 'O paciente selecionado não existe.',
            'message.max'                           => 'A mensagem não pode ter mais de 600 caracteres.',
            'physio_area_id.exists'                 => 'A área da fisioterapia selecionada não existe.',
            'physio_subarea_id.exists'              => 'A subárea selecionada não existe.',
            'end_date.after_or_equal'               => 'A data de término deve ser igual ou posterior à data de início.',
            'duration_minutes.min'                  => 'A duração deve ser de pelo menos 1 minuto.',
            'status.in'                             => 'Status inválido.',
            'groups.*.name.required_with'           => 'O nome do grupo é obrigatório.',
            'exercises.*.exercise_id.required_with' => 'O exercício é obrigatório.',
            'exercises.*.exercise_id.exists'        => 'O exercício selecionado não existe.',
            'exercises.*.period.in'                 => 'Período inválido.',
            'exercises.*.sets_min.min'              => 'O mínimo de séries deve ser pelo menos 1.',
            'exercises.*.sets_max.max'              => 'O máximo de séries não pode exceder 100.',
            'exercises.*.repetitions_min.min'       => 'O mínimo de repetições deve ser pelo menos 1.',
            'exercises.*.repetitions_max.max'       => 'O máximo de repetições não pode exceder 1000.',
        ];
    }
}
