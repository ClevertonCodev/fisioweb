<?php

namespace Modules\Patient\Models;

use App\Traits\JwtAuthenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Database\Factories\PatientFactory;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class Patient extends Authenticatable implements JWTSubject
{
    use HasFactory;
    use JwtAuthenticatable;
    use SoftDeletes;

    public const GUARD_NAME = 'patient';

    /** Status que retiram o paciente do conjunto "ativo" do dashboard. */
    public const STATUS_OBITO = 'obito';

    public const STATUS_CANCELADO = 'cancelado';

    public const STATUS_ALTA = 'alta';

    public const INACTIVE_STATUSES = [
        self::STATUS_OBITO,
        self::STATUS_CANCELADO,
        self::STATUS_ALTA,
    ];

    protected static function newFactory(): PatientFactory
    {
        return PatientFactory::new();
    }

    /** Pacientes ativos = status diferente de óbito, cancelado e alta (FR-006). */
    public function scopeActiveStatus($query)
    {
        return $query->whereNotIn('status', self::INACTIVE_STATUSES);
    }

    protected $fillable = [
        'clinic_id',
        'clinic_user_id',
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
        'diagnosis',
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

    public function clinicUser(): BelongsTo
    {
        return $this->belongsTo(ClinicUser::class);
    }
}
