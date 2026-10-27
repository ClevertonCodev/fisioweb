<?php

namespace Modules\TreatmentProgram\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TreatmentPlanFeedback extends Model
{
    protected $table = 'clinic_treatment_plan_feedbacks';

    protected $fillable = [
        'clinic_id',
        'treatment_plan_id',
        'patient_id',
        'execution_id',
        'pain',
        'pain_notes',
        'difficulty',
        'difficulty_notes',
        'satisfaction',
        'satisfaction_notes',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'pain'         => 'integer',
            'difficulty'   => 'integer',
            'submitted_at' => 'datetime',
        ];
    }

    public function treatmentPlan(): BelongsTo
    {
        return $this->belongsTo(TreatmentPlan::class);
    }

    public function execution(): BelongsTo
    {
        return $this->belongsTo(TreatmentPlanExecution::class, 'execution_id');
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(\Modules\Patient\Models\Patient::class);
    }
}
