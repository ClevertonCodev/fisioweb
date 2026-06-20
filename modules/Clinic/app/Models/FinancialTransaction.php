<?php

namespace Modules\Clinic\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Clinic\Database\Factories\FinancialTransactionFactory;
use Modules\Clinic\Enums\FinancialTransactionStatus;
use Modules\Clinic\Enums\FinancialTransactionType;
use Modules\Clinic\Enums\PaymentMethod;

class FinancialTransaction extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'clinic_financial_transactions';

    protected static function newFactory(): FinancialTransactionFactory
    {
        return FinancialTransactionFactory::new();
    }

    protected $fillable = [
        'clinic_id',
        'financial_category_id',
        'type',
        'status',
        'payment_method',
        'date',
        'description',
        'gross_amount',
        'fee_amount',
        'net_amount',
        'notes',
        'created_by_user_id',
        'deleted_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'type'           => FinancialTransactionType::class,
            'status'         => FinancialTransactionStatus::class,
            'payment_method' => PaymentMethod::class,
            'date'           => 'date',
            'gross_amount'   => 'decimal:2',
            'fee_amount'     => 'decimal:2',
            'net_amount'     => 'decimal:2',
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FinancialCategory::class, 'financial_category_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(ClinicUser::class, 'created_by_user_id');
    }

    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(ClinicUser::class, 'deleted_by_user_id');
    }

    public function scopeForClinic(Builder $query, int $clinicId): Builder
    {
        return $query->where($this->getTable() . '.clinic_id', $clinicId);
    }

    public static function computeNetAmount(float|string $gross, float|string $fee): string
    {
        return number_format((float) $gross - (float) $fee, 2, '.', '');
    }
}
