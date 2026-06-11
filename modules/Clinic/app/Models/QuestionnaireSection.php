<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestionnaireSection extends Model
{
    protected $table = 'clinic_questionnaire_sections';

    protected $fillable = [
        'questionnaire_template_id',
        'title',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(QuestionnaireTemplate::class, 'questionnaire_template_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(QuestionnaireQuestion::class)->orderBy('sort_order');
    }
}
