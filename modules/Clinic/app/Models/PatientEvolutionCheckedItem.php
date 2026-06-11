<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientEvolutionCheckedItem extends Model
{
    protected $table = 'clinic_patient_evolution_checked_items';

    protected $fillable = [
        'patient_evolution_id',
        'evolution_template_item_id',
        'free_text_value',
    ];

    public function evolution(): BelongsTo
    {
        return $this->belongsTo(PatientEvolution::class, 'patient_evolution_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(EvolutionTemplateItem::class, 'evolution_template_item_id');
    }
}
