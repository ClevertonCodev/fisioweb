<?php

namespace Modules\TreatmentProgram\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TreatmentPlanExecution extends Model
{
    protected $table = 'clinic_treatment_plan_executions';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_ABANDONED = 'abandoned';

    protected $fillable = [
        'clinic_id',
        'treatment_plan_id',
        'patient_id',
        'status',
        'unfinished_exercise_ids',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'unfinished_exercise_ids' => 'array',
            'started_at'              => 'datetime',
            'completed_at'            => 'datetime',
        ];
    }

    public function treatmentPlan(): BelongsTo
    {
        return $this->belongsTo(TreatmentPlan::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(\Modules\Patient\Models\Patient::class);
    }

    public function series(): HasMany
    {
        return $this->hasMany(TreatmentPlanExecutionSeries::class, 'execution_id');
    }

    public function feedbacks(): HasMany
    {
        return $this->hasMany(TreatmentPlanFeedback::class, 'execution_id');
    }
}
