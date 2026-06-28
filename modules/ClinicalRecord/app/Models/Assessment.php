<?php

namespace Modules\ClinicalRecord\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Assessment extends Model
{
    use SoftDeletes;

    protected $table = 'clinic_assessments';

    public const STATUS_DRAFT = 'draft';

    public const STATUS_SIGNED = 'signed';

    protected $fillable = [
        'clinic_id',
        'patient_id',
        'clinic_user_id',
        'admin_assessment_template_id',
        'status',
        'signed_at',
    ];

    protected function casts(): array
    {
        return [
            'signed_at' => 'datetime',
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(\Modules\Clinic\Models\Clinic::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(\Modules\Patient\Models\Patient::class);
    }

    public function clinicUser(): BelongsTo
    {
        return $this->belongsTo(\Modules\Clinic\Models\ClinicUser::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(\Modules\Admin\Models\AdminAssessmentTemplate::class, 'admin_assessment_template_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(AssessmentAnswer::class);
    }

    public function answerOptions(): HasMany
    {
        return $this->hasMany(AssessmentAnswerOption::class);
    }

    public function scopeForClinic($query, int $clinicId)
    {
        return $query->where('clinic_id', $clinicId);
    }
}
