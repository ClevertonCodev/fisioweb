<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PhysioArea extends Model
{
    protected $table = 'admin_physio_areas';

    protected $fillable = [
        'name',
        'description',
    ];

    public function subareas(): HasMany
    {
        return $this->hasMany(PhysioSubarea::class);
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(Exercise::class);
    }
}
