<?php

namespace Modules\ClinicFinance\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\ClinicFinance\Database\Factories\FinancialTransactionFactory;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Enums\PaymentMethod;

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
        'series_id',
        'series_index',
        'patient_id',
        'appointment_id',
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

    /** A série vai para a API no formato curto `series` (ver `series()`), não o model inteiro. */
    protected $hidden = ['financialSeries'];

    protected $appends = ['series', 'patient', 'appointment'];

    /**
     * Paciente e atendimento lidos por contrato (ver `TransactionPeopleServiceInterface::attachTo`).
     * Sem isso, o lançamento com paciente mostra só o id.
     *
     * @var array{patient: ?array{id: int, name: string}, appointment: ?array{id: int, starts_at: string}}|null
     */
    private ?array $people = null;

    protected function casts(): array
    {
        return [
            'series_index'   => 'integer',
            'patient_id'     => 'integer',
            'appointment_id' => 'integer',
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
        return $this->belongsTo(\Modules\Clinic\Models\Clinic::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FinancialCategory::class, 'financial_category_id');
    }

    /** Comprovantes (014). A listagem traz só `attachments_count`. */
    public function attachments(): HasMany
    {
        return $this->hasMany(FinancialAttachment::class, 'financial_transaction_id');
    }

    public function financialSeries(): BelongsTo
    {
        return $this->belongsTo(FinancialSeries::class, 'series_id');
    }

    /**
     * `{ id, kind, index, total }` da parcela ou ocorrência; `null` no lançamento avulso.
     * `total` só existe no parcelamento.
     */
    protected function series(): Attribute
    {
        return Attribute::get(function (): ?array {
            if (is_null($this->series_id)) {
                return null;
            }
            $series = $this->financialSeries;
            if (is_null($series)) {
                return null;
            }

            return [
                'id'    => (int) $series->id,
                'kind'  => $series->kind->value,
                'index' => (int) $this->series_index,
                'total' => $series->installments_total,
            ];
        });
    }

    /**
     * @param  array{id: int, name: string}|null  $patient
     * @param  array{id: int, starts_at: string}|null  $appointment
     */
    public function withPeople(?array $patient, ?array $appointment): static
    {
        $this->people = ['patient' => $patient, 'appointment' => $appointment];

        return $this;
    }

    /** `{ id, name }` de quem pagou; `null` sem paciente (ou paciente que não é mais da clínica). */
    protected function patient(): Attribute
    {
        return Attribute::get(function (): ?array {
            if (is_null($this->patient_id)) {
                return null;
            }

            return is_null($this->people) ? ['id' => (int) $this->patient_id, 'name' => null] : $this->people['patient'];
        });
    }

    /** `{ id, starts_at }` do atendimento; `null` sem atendimento. */
    protected function appointment(): Attribute
    {
        return Attribute::get(function (): ?array {
            if (is_null($this->appointment_id)) {
                return null;
            }

            return is_null($this->people) ? ['id' => (int) $this->appointment_id, 'starts_at' => null] : $this->people['appointment'];
        });
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\Clinic\Models\ClinicUser::class, 'created_by_user_id')->withTrashed();
    }

    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\Clinic\Models\ClinicUser::class, 'deleted_by_user_id')->withTrashed();
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
