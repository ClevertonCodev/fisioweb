<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EvolutionTemplateItem extends Model
{
    protected $fillable = [
        'evolution_template_section_id',
        'label',
        'print_text',
        'has_free_text',
        'free_text_placeholder',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'has_free_text' => 'boolean',
        ];
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(EvolutionTemplateSection::class, 'evolution_template_section_id');
    }
}
