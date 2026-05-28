<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class AdminAssessmentTemplate extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'is_active',
        'sort_order',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active'  => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function sections(): HasMany
    {
        return $this->hasMany(AdminAssessmentSection::class)->orderBy('sort_order');
    }

    public function fields(): HasManyThrough
    {
        return $this->hasManyThrough(
            AdminAssessmentField::class,
            AdminAssessmentSection::class,
            'admin_assessment_template_id',
            'admin_assessment_section_id',
            'id',
            'id',
        );
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
