<?php

namespace Modules\ClinicFinance\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\ClinicFinance\Enums\FinancialSeriesKind;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Enums\PaymentMethod;
use Modules\ClinicFinance\Enums\RecurrenceFrequency;

/**
 * Parcelamento ou recorrência: guarda a regra e os dados-modelo dos lançamentos
 * que a série gera (cada um com `series_id` e `series_index`).
 */
class FinancialSeries extends Model
{
    protected $table = 'clinic_financial_series';

    protected $fillable = [
        'clinic_id',
        'kind',
        'frequency',
        'anchor_date',
        'anchor_day',
        'ends_on',
        'installments_total',
        'generated_until',
        'next_occurrence_on',
        'type',
        'financial_category_id',
        'payment_method',
        'description',
        'gross_amount',
        'fee_amount',
        'notes',
        'patient_id',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'kind'               => FinancialSeriesKind::class,
            'frequency'          => RecurrenceFrequency::class,
            'type'               => FinancialTransactionType::class,
            'payment_method'     => PaymentMethod::class,
            'anchor_date'        => 'date',
            'ends_on'            => 'date',
            'generated_until'    => 'date',
            'next_occurrence_on' => 'date',
            'anchor_day'         => 'integer',
            'installments_total' => 'integer',
            'gross_amount'       => 'decimal:2',
            'fee_amount'         => 'decimal:2',
        ];
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(FinancialTransaction::class, 'series_id');
    }

    public function scopeForClinic(Builder $query, int $clinicId): Builder
    {
        return $query->where($this->getTable() . '.clinic_id', $clinicId);
    }
}
