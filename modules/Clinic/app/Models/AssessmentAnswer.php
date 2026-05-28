<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Admin\Models\AdminAssessmentField;

class AssessmentAnswer extends Model
{
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
        return $this->belongsTo(AdminAssessmentField::class, 'admin_assessment_field_id');
    }
}
