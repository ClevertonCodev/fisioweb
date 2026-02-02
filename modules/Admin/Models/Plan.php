<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasFactory;

    public function featurePlans(): HasMany
    {
        return $this->hasMany(FeaturePlan::class);
    }

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

    public function clinics(): HasMany
    {
        return $this->hasMany(Clinic::class);
    }

    public function getNameAttribute($value)
    {
        if (!$value) {
            return null;
        }

        return $this->getLabelNames($value);
    }

    public function getLabelNames(string $name): string
    {
        $labels = [
            'start' => 'Start',
            'perform' => 'Perform',
            'premium' => 'Premium',
        ];

        return $labels[$name] ?? $name;
    }
}
