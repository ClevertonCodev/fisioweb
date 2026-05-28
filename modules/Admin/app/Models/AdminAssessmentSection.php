<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdminAssessmentSection extends Model
{
    protected $fillable = [
        'admin_assessment_template_id',
        'title',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(AdminAssessmentTemplate::class, 'admin_assessment_template_id');
    }

    public function fields(): HasMany
    {
        return $this->hasMany(AdminAssessmentField::class)->orderBy('sort_order');
    }
}
