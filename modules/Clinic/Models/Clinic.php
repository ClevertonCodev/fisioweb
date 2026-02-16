<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Admin\Models\Plan;

class Clinic extends Model
{
    use HasFactory;

    // Constantes para status
    public const STATUS_ACTIVE = 1;

    public const STATUS_INACTIVE = 0;

    public const STATUS_CANCELLED = -1;

    // Constantes para type_person
    public const TYPE_PERSON_FISICA = 'fisica';

    public const TYPE_PERSON_JURIDICA = 'juridica';

    protected $fillable = [
        'name',
        'document',
        'type_person',
        'status',
        'email',
        'phone',
        'slug',
        'zip_code',
        'address',
        'number',
        'city',
        'state',
        'plan_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'integer',
        ];
    }

    public function getCreatedAtAttribute($value)
    {
        if (! $value) {
            return null;
        }

        return \Carbon\Carbon::parse($value)->format('d/m/Y H:i');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(ClinicUser::class);
    }
}
