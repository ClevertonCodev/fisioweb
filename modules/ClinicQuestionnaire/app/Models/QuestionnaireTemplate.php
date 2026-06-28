<?php

namespace Modules\ClinicQuestionnaire\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\ClinicQuestionnaire\Database\Factories\QuestionnaireTemplateFactory;

class QuestionnaireTemplate extends Model
{
    protected $table = 'clinic_questionnaire_templates';

    use HasFactory, SoftDeletes;

    protected static function newFactory(): QuestionnaireTemplateFactory
    {
        return QuestionnaireTemplateFactory::new();
    }

    protected $fillable = [
        'clinic_id',
        'title',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(\Modules\Clinic\Models\Clinic::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(QuestionnaireSection::class)->orderBy('sort_order');
    }

    public function patientQuestionnaires(): HasMany
    {
        return $this->hasMany(PatientQuestionnaire::class);
    }

    public function scopeForClinic($query, int $clinicId)
    {
        return $query->where('clinic_id', $clinicId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
