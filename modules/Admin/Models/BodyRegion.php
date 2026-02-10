<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BodyRegion extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'parent_id',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(BodyRegion::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(BodyRegion::class, 'parent_id');
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(Exercise::class);
    }

    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id');
    }
}
