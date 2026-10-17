<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Model;

class ClinicUserPreference extends Model
{
    protected $table = 'clinic_user_preferences';

    protected $fillable = [
        'clinic_id',
        'clinic_user_id',
        'key',
        'value',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'json',
        ];
    }
}
