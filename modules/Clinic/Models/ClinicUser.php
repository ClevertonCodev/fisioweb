<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class ClinicUser extends Authenticatable
{
    use HasFactory;
    use Notifiable;
    use TwoFactorAuthenticatable;

    public const STATUS_ACTIVE = 1;

    public const STATUS_INACTIVE = 0;

    public const STATUS_DELETED = -1;

    public const ROLE_ADMIN = 'admin';

    public const ROLE_PHYSIOTHERAPIST = 'physiotherapist';

    public const ROLE_COMMON = 'common';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'clinic_id',
        'name',
        'email',
        'password',
        'role',
        'document',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_recovery_codes',
        'two_factor_secret',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at'       => 'datetime',
            'password'                => 'hashed',
            'status'                  => 'integer',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Get the clinic that owns the user.
     */
    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    /**
     * Check if user is active.
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Check if user is admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /**
     * Check if user is fisioterapeuta.
     */
    public function isPhysiotherapist(): bool
    {
        return $this->role === self::ROLE_PHYSIOTHERAPIST;
    }

    public function exerciseFavorites(): HasMany
    {
        return $this->hasMany(ExerciseFavorite::class);
    }

    public function treatmentPlans(): HasMany
    {
        return $this->hasMany(TreatmentPlan::class);
    }
}
