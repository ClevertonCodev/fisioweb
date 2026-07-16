<?php

namespace Modules\TreatmentProgram\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class TreatmentPlan extends Model
{
    protected $table = 'clinic_treatment_plans';

    public const STATUS_DRAFT = 'draft';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_DRAFT     => 'Rascunho',
        self::STATUS_ACTIVE    => 'Ativo',
        self::STATUS_COMPLETED => 'Concluído',
        self::STATUS_CANCELLED => 'Cancelado',
    ];

    protected $fillable = [
        'clinic_id',
        'patient_id',
        'clinic_user_id',
        'public_token',
        'title',
        'message',
        'physio_area_id',
        'physio_subarea_id',
        'start_date',
        'end_date',
        'duration_minutes',
        'status',
        'notes',
        'patient_viewed_at',
        'patient_completed_count',
    ];

    protected function casts(): array
    {
        return [
            'start_date'               => 'date',
            'end_date'                 => 'date',
            'duration_minutes'         => 'integer',
            'patient_viewed_at'        => 'datetime',
            'patient_completed_count'  => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (TreatmentPlan $plan) {
            if (empty($plan->public_token)) {
                $plan->public_token = (string) Str::uuid();
            }
        });
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(\Modules\Clinic\Models\Clinic::class);
    }

    public function clinicUser(): BelongsTo
    {
        return $this->belongsTo(\Modules\Clinic\Models\ClinicUser::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(\Modules\Patient\Models\Patient::class);
    }

    public function physioArea(): BelongsTo
    {
        return $this->belongsTo(\Modules\Admin\Models\PhysioArea::class);
    }

    public function physioSubarea(): BelongsTo
    {
        return $this->belongsTo(\Modules\Admin\Models\PhysioSubarea::class);
    }

    public function groups(): HasMany
    {
        return $this->hasMany(TreatmentPlanGroup::class)->orderBy('sort_order');
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(TreatmentPlanExercise::class)->orderBy('sort_order');
    }

    public function scopeForClinic($query, int $clinicId)
    {
        return $query->where('clinic_id', $clinicId);
    }
}
