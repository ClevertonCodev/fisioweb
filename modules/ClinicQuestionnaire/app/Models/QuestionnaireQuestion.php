<?php

namespace Modules\ClinicQuestionnaire\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestionnaireQuestion extends Model
{
    protected $table = 'clinic_questionnaire_questions';

    public const TYPE_MULTIPLE_CHOICE = 'multiple_choice';

    public const TYPE_CHECKBOX = 'checkbox';

    public const TYPE_SCALE = 'scale';

    public const TYPE_TEXT = 'text';

    protected $fillable = [
        'questionnaire_section_id',
        'label',
        'type',
        'options',
        'scale_min',
        'scale_max',
        'required',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'options'    => 'array',
            'scale_min'  => 'integer',
            'scale_max'  => 'integer',
            'required'   => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(QuestionnaireSection::class, 'questionnaire_section_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(PatientQuestionnaireAnswer::class);
    }
}
