<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasFactory;

    // Constantes para type_charge
    public const TYPE_CHARGE_POR_USUARIO = 'por_usuario';
    public const TYPE_CHARGE_FIXO = 'fixo';

    protected $fillable = [
        'name',
        'type_charge',
        'value_month',
        'value_year',
    ];

    protected function casts(): array
    {
        return [
            'value_month' => 'decimal:2',
            'value_year' => 'decimal:2',
        ];
    }

    /**
     * Get all clinics using this plan.
     */
    public function clinics(): HasMany
    {
        return $this->hasMany(Clinic::class);
    }
}
