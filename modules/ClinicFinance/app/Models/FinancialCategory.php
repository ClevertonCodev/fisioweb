<?php

namespace Modules\ClinicFinance\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\ClinicFinance\Database\Factories\FinancialCategoryFactory;
use Modules\ClinicFinance\Enums\FinancialCategoryOrigin;
use Modules\ClinicFinance\Enums\FinancialTransactionType;

class FinancialCategory extends Model
{
    use HasFactory;

    protected $table = 'clinic_financial_categories';

    protected static function newFactory(): FinancialCategoryFactory
    {
        return FinancialCategoryFactory::new();
    }

    protected $fillable = [
        'clinic_id',
        'name',
        'type',
        'origin',
        'active',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'type'          => FinancialTransactionType::class,
            'origin'        => FinancialCategoryOrigin::class,
            'active'        => 'boolean',
            'display_order' => 'integer',
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(\Modules\Clinic\Models\Clinic::class);
    }

    public function overrides(): HasMany
    {
        return $this->hasMany(ClinicCategoryOverride::class, 'financial_category_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(FinancialTransaction::class, 'financial_category_id');
    }

    public function scopeAvailableForClinic(Builder $query, int $clinicId): Builder
    {
        return $query
            ->where(function (Builder $q) use ($clinicId) {
                $q->where(function (Builder $system) use ($clinicId) {
                    $system
                        ->where('origin', FinancialCategoryOrigin::System->value)
                        ->where('active', true)
                        ->whereDoesntHave('overrides', function (Builder $override) use ($clinicId) {
                            $override->where('clinic_id', $clinicId);
                        });
                })->orWhere(function (Builder $custom) use ($clinicId) {
                    $custom
                        ->where('origin', FinancialCategoryOrigin::Custom->value)
                        ->where('clinic_id', $clinicId)
                        ->where('active', true);
                });
            })
            ->orderBy('type')
            ->orderBy('display_order')
            ->orderBy('name');
    }
}
