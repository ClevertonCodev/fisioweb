<?php

namespace Modules\Clinic\Models;

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
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(EvolutionTemplate::class, 'evolution_template_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(EvolutionTemplateItem::class, 'evolution_template_section_id')->orderBy('sort_order');
    }
}
