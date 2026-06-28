<?php

namespace Modules\ClinicScheduling\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\ClinicScheduling\Database\Factories\AppointmentFactory;
use Modules\ClinicScheduling\Enums\AppointmentStatus;

class Appointment extends Model
{
    use HasFactory;

    protected $table = 'clinic_appointments';

    public const SOURCE_SYSTEM = 'system';

    public const SOURCE_GOOGLE = 'google';

    protected static function newFactory(): AppointmentFactory
    {
        return AppointmentFactory::new();
    }

    protected $fillable = [
        'clinic_id',
        'patient_id',
        'clinic_user_id',
        'title',
        'description',
        'location',
        'starts_at',
        'ends_at',
        'status',
        'google_event_id',
        'source',
        'last_synced_at',
    ];

    protected function casts(): array
    {
        return [
            'starts_at'      => 'datetime',
            'ends_at'        => 'datetime',
            'last_synced_at' => 'datetime',
            'status'         => AppointmentStatus::class,
        ];
    }

    // Relações cross-module por FQN inline (fronteira modular — ver ADR-008).
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

    public function scopeForClinic($query, int $clinicId)
    {
        return $query->where('clinic_id', $clinicId);
    }

    public function scopeForClinicUser($query, int $clinicUserId)
    {
        return $query->where('clinic_user_id', $clinicUserId);
    }
}
