<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminProgramExercise extends Model
{
    protected $fillable = [
        'admin_program_id',
        'admin_program_group_id',
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
            'load_min'        => 'float',
            'load_max'        => 'float',
            'rest_time'       => 'integer',
            'sort_order'      => 'integer',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(AdminProgram::class, 'admin_program_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(AdminProgramGroup::class, 'admin_program_group_id');
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
