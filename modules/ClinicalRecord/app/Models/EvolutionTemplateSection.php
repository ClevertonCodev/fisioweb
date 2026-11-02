<?php

namespace Modules\ClinicalRecord\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EvolutionTemplateSection extends Model
{
    protected $table = 'clinic_evolution_template_sections';

    protected $fillable = [
        'evolution_template_id',
        'title',
        'sort_order',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'archived_at' => 'datetime',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(EvolutionTemplate::class, 'evolution_template_id')->withTrashed();
    }

    public function items(): HasMany
    {
        return $this->hasMany(EvolutionTemplateItem::class, 'evolution_template_section_id')
            ->whereNull('archived_at')
            ->orderBy('sort_order');
    }

    public function allItems(): HasMany
    {
        return $this->hasMany(EvolutionTemplateItem::class, 'evolution_template_section_id')->orderBy('sort_order');
    }

    public function scopeActive($query)
    {
        return $query->whereNull('archived_at');
    }
}
