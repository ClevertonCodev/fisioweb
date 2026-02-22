<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Admin\Models\Exercise;

class TreatmentPlanExercise extends Model
{
    use HasFactory;

    public const PERIOD_MORNING = 'morning';

    public const PERIOD_AFTERNOON = 'afternoon';

    public const PERIOD_NIGHT = 'night';

    public const PERIODS = [
        self::PERIOD_MORNING   => 'Manhã',
        self::PERIOD_AFTERNOON => 'Tarde',
        self::PERIOD_NIGHT     => 'Noite',
    ];

    protected $fillable = [
        'treatment_plan_id',
        'treatment_plan_group_id',
        'exercise_id',
        'days_of_week',
        'period',
        'sets_min',
        'sets_max',
        'repetitions_min',
        'repetitions_max',
        'load_min',
        'load_max',
        'rest_time',
        'notes',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'days_of_week'    => 'array',
            'sets_min'        => 'integer',
            'sets_max'        => 'integer',
            'repetitions_min' => 'integer',
            'repetitions_max' => 'integer',
            'load_min'        => 'decimal:2',
            'load_max'        => 'decimal:2',
            'sort_order'      => 'integer',
        ];
    }

    public function treatmentPlan(): BelongsTo
    {
        return $this->belongsTo(TreatmentPlan::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(TreatmentPlanGroup::class, 'treatment_plan_group_id');
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
