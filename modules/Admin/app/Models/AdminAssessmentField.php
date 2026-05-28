<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdminAssessmentField extends Model
{
    protected $fillable = [
        'admin_assessment_section_id',
        'label',
        'field_type',
        'required',
        'sort_order',
        'config',
    ];

    protected function casts(): array
    {
        return [
            'required'   => 'boolean',
            'sort_order' => 'integer',
            'config'     => 'array',
        ];
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(AdminAssessmentSection::class, 'admin_assessment_section_id');
    }

    public function options(): HasMany
    {
        return $this->hasMany(AdminAssessmentFieldOption::class)->orderBy('sort_order');
    }
}
