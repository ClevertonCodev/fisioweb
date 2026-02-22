<?php

namespace Modules\Patient\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\TreatmentPlan;

class Patient extends Authenticatable
{
    use HasFactory;
    use Notifiable;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'cpf',
        'gender',
        'biological_sex',
        'birth_date',
        'marital_status',
        'education',
        'profession',
        'phone',
        'email',
        'password',
        'emergency_contact',
        'caregiver_contact',
        'insurance',
        'insurance_number',
        'address',
        'city',
        'state',
        'zip_code',
        'referral_source',
        'is_active',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'birth_date'        => 'date',
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
        ];
    }

    /**
     * Clínicas onde o paciente é atendido (N:N).
     */
    public function clinics(): BelongsToMany
    {
        return $this->belongsToMany(Clinic::class, 'clinic_patient')
            ->withPivot('registered_by')
            ->withTimestamps();
    }

    /**
     * Planos de tratamento do paciente.
     */
    public function treatmentPlans(): HasMany
    {
        return $this->hasMany(TreatmentPlan::class);
    }

    /**
     * Planos de tratamento filtrados por clínica.
     */
    public function treatmentPlansByClinic(int $clinicId): HasMany
    {
        return $this->hasMany(TreatmentPlan::class)->where('clinic_id', $clinicId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
