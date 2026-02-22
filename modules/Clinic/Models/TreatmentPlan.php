<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\PhysioSubarea;
use Modules\Patient\Models\Patient;

class TreatmentPlan extends Model
{
    use HasFactory;

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
        'title',
        'message',
        'physio_area_id',
        'physio_subarea_id',
        'start_date',
        'end_date',
        'duration_minutes',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date'       => 'date',
            'end_date'         => 'date',
            'duration_minutes' => 'integer',
        ];
    }

    // Relacionamentos

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function clinicUser(): BelongsTo
    {
        return $this->belongsTo(ClinicUser::class);
    }

    public function physioArea(): BelongsTo
    {
        return $this->belongsTo(PhysioArea::class);
    }

    public function physioSubarea(): BelongsTo
    {
        return $this->belongsTo(PhysioSubarea::class);
    }

    public function groups(): HasMany
    {
        return $this->hasMany(TreatmentPlanGroup::class)->orderBy('sort_order');
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(TreatmentPlanExercise::class)->orderBy('sort_order');
    }

    // Scopes

    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeForClinic($query, int $clinicId)
    {
        return $query->where('clinic_id', $clinicId);
    }
}
