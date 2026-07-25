<?php

namespace Modules\TreatmentProgram\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TreatmentPlanExecutionSeries extends Model
{
    protected $table = 'clinic_treatment_plan_execution_series';

    protected $fillable = [
        'execution_id',
        'treatment_plan_exercise_id',
        'series_index',
        'count',
        'weight_value',
        'weight_unit',
        'is_bodyweight',
    ];

    protected function casts(): array
    {
        return [
            'series_index'   => 'integer',
            'count'          => 'integer',
            'is_bodyweight'  => 'boolean',
        ];
    }

    public function execution(): BelongsTo
    {
        return $this->belongsTo(TreatmentPlanExecution::class, 'execution_id');
    }

    public function treatmentPlanExercise(): BelongsTo
    {
        return $this->belongsTo(TreatmentPlanExercise::class, 'treatment_plan_exercise_id');
    }
}
