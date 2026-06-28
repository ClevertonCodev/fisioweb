<?php

namespace Modules\ClinicalRecord\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentAnswer extends Model
{
    protected $table = 'clinic_assessment_answers';

    protected $fillable = [
        'assessment_id',
        'admin_assessment_field_id',
        'value',
    ];

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(\Modules\Admin\Models\AdminAssessmentField::class, 'admin_assessment_field_id');
    }
}
