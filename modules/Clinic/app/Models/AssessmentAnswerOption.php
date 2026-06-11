<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Admin\Models\AdminAssessmentField;
use Modules\Admin\Models\AdminAssessmentFieldOption;

class AssessmentAnswerOption extends Model
{
    protected $table = 'clinic_assessment_answer_options';

    protected $fillable = [
        'assessment_id',
        'admin_assessment_field_id',
        'admin_assessment_field_option_id',
    ];

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(AdminAssessmentField::class, 'admin_assessment_field_id');
    }

    public function option(): BelongsTo
    {
        return $this->belongsTo(AdminAssessmentFieldOption::class, 'admin_assessment_field_option_id');
    }
}
