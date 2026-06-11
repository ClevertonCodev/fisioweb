<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Clinic\Database\Factories\PatientQuestionnaireFactory;

class PatientQuestionnaire extends Model
{
    protected $table = 'clinic_patient_questionnaires';

    use HasFactory, SoftDeletes;

    protected static function newFactory(): PatientQuestionnaireFactory
    {
        return PatientQuestionnaireFactory::new();
    }

    const STATUS_PENDING  = 'pending';

    const STATUS_ANSWERED = 'answered';

    const STATUS_EXPIRED  = 'expired';

    const MODALITY_PRESENCIAL = 'presencial';

    const MODALITY_REMOTO     = 'remoto';

    protected $fillable = [
        'clinic_id',
        'patient_id',
        'clinic_user_id',
        'questionnaire_template_id',
        'modality',
        'status',
        'answered_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'answered_at' => 'datetime',
            'expires_at'  => 'datetime',
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function clinicUser(): BelongsTo
    {
        return $this->belongsTo(ClinicUser::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(QuestionnaireTemplate::class, 'questionnaire_template_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(PatientQuestionnaireAnswer::class);
    }

    public function scopeForClinic($query, int $clinicId)
    {
        return $query->where('clinic_id', $clinicId);
    }
}
