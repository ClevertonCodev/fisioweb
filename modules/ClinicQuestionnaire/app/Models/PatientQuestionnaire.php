<?php

namespace Modules\ClinicQuestionnaire\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\ClinicQuestionnaire\Database\Factories\PatientQuestionnaireFactory;

class PatientQuestionnaire extends Model
{
    protected $table = 'clinic_patient_questionnaires';

    use HasFactory, SoftDeletes;

    protected static function newFactory(): PatientQuestionnaireFactory
    {
        return PatientQuestionnaireFactory::new();
    }

    public const STATUS_PENDING = 'pending';

    public const STATUS_ANSWERED = 'answered';

    public const STATUS_EXPIRED = 'expired';

    public const MODALITY_PRESENCIAL = 'presencial';

    public const MODALITY_REMOTO = 'remoto';

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
        return $this->belongsTo(\Modules\Clinic\Models\Clinic::class);
    }

    public function clinicUser(): BelongsTo
    {
        return $this->belongsTo(\Modules\Clinic\Models\ClinicUser::class);
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
