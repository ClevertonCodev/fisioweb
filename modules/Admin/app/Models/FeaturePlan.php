<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeaturePlan extends Model
{
    protected $table = 'admin_feature_plans';

    protected $fillable = [
        'plan_id',
        'feature_id',
        'value',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'boolean',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function feature(): BelongsTo
    {
        return $this->belongsTo(Feature::class, 'feature_id');
    }
}
