<?php

namespace Modules\Patient\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Modules\Clinic\Models\Clinic;

class Patient extends Authenticatable
{
    use HasFactory;
    use Notifiable;
    use SoftDeletes;

    protected $fillable = [
        'clinic_id',
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

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function treatmentPlans(): HasMany
    {
        return $this->hasMany(\Modules\Clinic\Models\TreatmentPlan::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
