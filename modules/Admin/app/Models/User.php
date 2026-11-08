<?php

namespace Modules\Admin\Models;

use App\Contracts\RevokesTokensOnPasswordChange;
use App\Traits\JwtAuthenticatable;
use App\Traits\TracksPasswordChange;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Modules\Admin\Database\Factories\UserFactory;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject, RevokesTokensOnPasswordChange
{
    use HasFactory, JwtAuthenticatable, Notifiable, TracksPasswordChange;

    protected static function newFactory(): UserFactory
    {
        return UserFactory::new();
    }

    public const GUARD_NAME = 'admin';

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }
}
