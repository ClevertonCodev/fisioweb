<?php

namespace Modules\Patient\Models;

use App\Traits\JwtAuthenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Modules\Clinic\Models\Clinic;
use Modules\Patient\Database\Factories\PatientFactory;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class Patient extends Authenticatable implements JWTSubject
{
    use HasFactory;
    use JwtAuthenticatable;
    use SoftDeletes;

    public const GUARD_NAME = 'patient';

    protected static function newFactory(): PatientFactory
    {
        return PatientFactory::new();
    }

    protected $fillable = [
        'clinic_id',
        'name',
        'email',
        'password',
        'cpf',
        'phone',
        'birth_date',
        'gender',
        'biological_sex',
        'marital_status',
        'education',
        'profession',
        'emergency_contact',
        'caregiver_contact',
        'insurance',
        'insurance_number',
        'address',
        'city',
        'state',
        'zip_code',
        'referral_source',
        'neighborhood',
        'apelido',
        'use_apelido',
        'is_foreign',
        'is_active',
        'status',
        'photo_url',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'password'    => 'hashed',
            'birth_date'  => 'date',
            'is_active'   => 'boolean',
            'use_apelido' => 'boolean',
            'is_foreign'  => 'boolean',
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }
}
