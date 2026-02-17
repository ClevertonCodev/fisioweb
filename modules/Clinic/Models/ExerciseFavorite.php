<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Admin\Models\Exercise;

class ExerciseFavorite extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'clinic_user_id',
        'exercise_id',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function clinicUser(): BelongsTo
    {
        return $this->belongsTo(ClinicUser::class);
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
