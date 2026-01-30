<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeaturePlan extends Model
{
    use HasFactory;

    protected $table = 'feature_plans';

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
