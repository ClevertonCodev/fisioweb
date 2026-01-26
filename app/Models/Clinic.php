<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'url',
        'address',
        'city',
        'state',
        'zip_code',
        'plan_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'integer',
        ];
    }

    /**
     * Get the plan that owns the clinic.
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }
}
