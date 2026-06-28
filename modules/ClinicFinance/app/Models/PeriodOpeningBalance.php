<?php

namespace Modules\ClinicFinance\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\ClinicFinance\Database\Factories\PeriodOpeningBalanceFactory;

class PeriodOpeningBalance extends Model
{
    use HasFactory;

    protected $table = 'clinic_financial_opening_balances';

    protected static function newFactory(): PeriodOpeningBalanceFactory
    {
        return PeriodOpeningBalanceFactory::new();
    }

    protected $fillable = [
        'clinic_id',
        'year',
        'month',
        'amount',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'year'   => 'integer',
            'month'  => 'integer',
            'amount' => 'decimal:2',
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(\Modules\Clinic\Models\Clinic::class);
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\Clinic\Models\ClinicUser::class, 'updated_by_user_id');
    }
}
