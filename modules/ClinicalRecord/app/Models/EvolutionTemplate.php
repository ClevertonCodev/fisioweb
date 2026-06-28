<?php

namespace Modules\ClinicalRecord\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EvolutionTemplate extends Model
{
    protected $table = 'clinic_evolution_templates';

    protected $fillable = [
        'clinic_id',
        'name',
        'description',
        'is_system',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(\Modules\Clinic\Models\Clinic::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(EvolutionTemplateSection::class)->orderBy('sort_order');
    }

    public function scopeAvailableForClinic($query, int $clinicId)
    {
        return $query->where(function ($q) use ($clinicId) {
            $q->where('clinic_id', $clinicId)->orWhere('is_system', true);
        });
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
