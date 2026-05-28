<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdminProgramGroup extends Model
{
    protected $fillable = [
        'admin_program_id',
        'name',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(AdminProgram::class, 'admin_program_id');
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(AdminProgramExercise::class, 'admin_program_group_id')->orderBy('sort_order');
    }
}
