<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TreatmentPlanGroup extends Model
{
    protected $table = 'clinic_treatment_plan_groups';

    protected $fillable = [
        'treatment_plan_id',
        'name',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function treatmentPlan(): BelongsTo
    {
        return $this->belongsTo(TreatmentPlan::class);
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(TreatmentPlanExercise::class, 'treatment_plan_group_id')->orderBy('sort_order');
    }
}
