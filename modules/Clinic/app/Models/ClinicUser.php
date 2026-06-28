<?php

namespace Modules\Clinic\Models;

use App\Traits\JwtAuthenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Modules\Clinic\Database\Factories\ClinicUserFactory;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class ClinicUser extends Authenticatable implements JWTSubject
{
    use HasFactory, JwtAuthenticatable, Notifiable;

    protected static function newFactory(): ClinicUserFactory
    {
        return ClinicUserFactory::new();
    }

    public const GUARD_NAME = 'clinic';

    public const ROLE_ADMIN = 'admin';

    public const ROLE_PHYSIOTHERAPIST = 'physiotherapist';

    public const ROLE_SECRETARY = 'secretary';

    public const ROLES = [
        self::ROLE_ADMIN           => 'Administrador',
        self::ROLE_PHYSIOTHERAPIST => 'Fisioterapeuta',
        self::ROLE_SECRETARY       => 'Secretário(a)',
    ];

    public const STATUS_ACTIVE = 1;

    public const STATUS_INACTIVE = 0;

    public const MESTRE_YES = 1;

    public const MESTRE_NO = 0;

    protected $fillable = [
        'clinic_id',
        'name',
        'email',
        'password',
        'role',
        'mestre',
        'document',
        'photo_url',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'google_access_token',
        'google_refresh_token',
        'google_sync_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at'       => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
            'password'                => 'hashed',
            'status'                  => 'integer',
            'mestre'                  => 'integer',
            'google_access_token'     => 'encrypted',
            'google_refresh_token'    => 'encrypted',
            'google_sync_token'       => 'encrypted',
            'google_token_expires_at' => 'datetime',
            'google_connected_at'     => 'datetime',
        ];
    }

    public function isGoogleConnected(): bool
    {
        return $this->google_connected_at !== null;
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function exerciseFavorites(): HasMany
    {
        return $this->hasMany(ExerciseFavorite::class);
    }

    public function treatmentPlans(): HasMany
    {
        return $this->hasMany(TreatmentPlan::class);
    }

    public function appointments(): HasMany
    {
        // Agendamento pertence ao módulo ClinicScheduling (FQN inline — fronteira modular).
        return $this->hasMany(\Modules\ClinicScheduling\Models\Appointment::class, 'clinic_user_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isMaster(): bool
    {
        return (int) $this->mestre === self::MESTRE_YES;
    }

    public function isSecretary(): bool
    {
        return $this->role === self::ROLE_SECRETARY;
    }

    public function isPhysiotherapist(): bool
    {
        return $this->role === self::ROLE_PHYSIOTHERAPIST;
    }

    public function owns(\Illuminate\Database\Eloquent\Model $record): bool
    {
        return $record->clinic_user_id === $this->id;
    }
}
