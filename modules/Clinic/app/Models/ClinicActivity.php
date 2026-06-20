<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Modules\Clinic\Enums\ActivityType;

class ClinicActivity extends Model
{
    protected $table = 'clinic_activities';

    protected $fillable = [
        'clinic_id',
        'clinic_user_id',
        'type',
        'description',
        'subject_type',
        'subject_id',
    ];

    protected function casts(): array
    {
        return [
            'type' => ActivityType::class,
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    /** Ator que realizou a ação. */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(ClinicUser::class, 'clinic_user_id');
    }

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopeForClinic($query, int $clinicId)
    {
        return $query->where('clinic_id', $clinicId);
    }

    /** Atividades do dia corrente no timezone informado. */
    public function scopeOnDate($query, \Carbon\Carbon $start, \Carbon\Carbon $end)
    {
        return $query->whereBetween('created_at', [$start, $end]);
    }
}
