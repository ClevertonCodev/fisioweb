<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PhysioSubarea extends Model
{
    protected $table = 'admin_physio_subareas';

    protected $fillable = [
        'physio_area_id',
        'name',
    ];

    public function physioArea(): BelongsTo
    {
        return $this->belongsTo(PhysioArea::class);
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(Exercise::class);
    }
}
