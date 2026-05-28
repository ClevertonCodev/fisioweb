<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Admin\Models\Plan;
use Modules\Clinic\Database\Factories\ClinicFactory;
use Modules\Patient\Models\Patient;

class Clinic extends Model
{
    use HasFactory, SoftDeletes;

    protected static function newFactory(): ClinicFactory
    {
        return ClinicFactory::new();
    }

    public const STATUS_ACTIVE = 1;

    public const STATUS_INACTIVE = 0;

    public const STATUS_CANCELLED = -1;

    public const TYPE_PERSON_FISICA = 'fisica';

    public const TYPE_PERSON_JURIDICA = 'juridica';

    protected $fillable = [
        'name',
        'email',
        'document',
        'type_person',
        'status',
        'slug',
        'zip_code',
        'address',
        'number',
        'city',
        'state',
        'phone',
        'plan_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'integer',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function clinicUsers(): HasMany
    {
        return $this->hasMany(ClinicUser::class);
    }

    public function patients(): BelongsToMany
    {
        return $this->belongsToMany(Patient::class, 'clinic_patient')->withPivot('registered_by')->withTimestamps();
    }

    public function treatmentPlans(): HasMany
    {
        return $this->hasMany(TreatmentPlan::class);
    }
}
