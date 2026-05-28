<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AdminProgram extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'created_by',
        'title',
        'description',
        'physio_area_id',
        'physio_subarea_id',
        'duration_minutes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active'        => 'boolean',
            'duration_minutes' => 'integer',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function physioArea(): BelongsTo
    {
        return $this->belongsTo(PhysioArea::class);
    }

    public function physioSubarea(): BelongsTo
    {
        return $this->belongsTo(PhysioSubarea::class);
    }

    public function groups(): HasMany
    {
        return $this->hasMany(AdminProgramGroup::class)->orderBy('sort_order');
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(AdminProgramExercise::class)->orderBy('sort_order');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
