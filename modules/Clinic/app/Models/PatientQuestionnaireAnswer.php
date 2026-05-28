<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientQuestionnaireAnswer extends Model
{
    protected $fillable = [
        'patient_questionnaire_id',
        'questionnaire_question_id',
        'answer',
    ];

    protected function casts(): array
    {
        return [
            'answer' => 'array',
        ];
    }

    public function patientQuestionnaire(): BelongsTo
    {
        return $this->belongsTo(PatientQuestionnaire::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(QuestionnaireQuestion::class, 'questionnaire_question_id');
    }
}
