<?php

namespace Modules\ClinicFinance\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Modules\ClinicFinance\Contracts\FinancialRecurrenceServiceInterface;
use Modules\ClinicFinance\Contracts\FinancialSeriesRepositoryInterface;
use Modules\ClinicFinance\Contracts\FinancialSeriesServiceInterface;
use Modules\ClinicFinance\Contracts\FinancialTransactionRepositoryInterface;
use Modules\ClinicFinance\Contracts\FinancialTransactionServiceInterface;
use Modules\ClinicFinance\Contracts\TransactionPeopleServiceInterface;
use Modules\ClinicFinance\Data\RecordedTransactions;
use Modules\ClinicFinance\Data\TransactionRepeat;
use Modules\ClinicFinance\Enums\FinancialSeriesKind;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Enums\SeriesScope;
use Modules\ClinicFinance\Models\FinancialSeries;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Modules\ClinicFinance\Support\InstallmentSplit;

class FinancialSeriesService implements FinancialSeriesServiceInterface
{
    /** O que "esta e as próximas" leva às próximas parcelas, quando mudou nesta. */
    private const SHARED_FIELDS = [
        'type',
        'financial_category_id',
        'payment_method',
        'description',
        'notes',
        'gross_amount',
        'fee_amount',
    ];

    public function __construct(
        protected FinancialTransactionServiceInterface $transactions,
        protected FinancialTransactionRepositoryInterface $transactionRepository,
        protected FinancialSeriesRepositoryInterface $seriesRepository,
        protected FinancialRecurrenceServiceInterface $recurrences,
        protected TransactionPeopleServiceInterface $people,
    ) {}

    public function record(int $clinicId, array $data, TransactionRepeat $repeat): RecordedTransactions
    {
        $recorded = match (true) {
            !$repeat->repeats()                                 => new RecordedTransactions($this->transactions->create($clinicId, $data), 1),
            $repeat->kind === FinancialSeriesKind::Installments => $this->recordInstallments($clinicId, $data, (int) $repeat->installments),
            default                                             => $this->recurrences->start($clinicId, $data, $repeat),
        };
        $this->people->attachTo($clinicId, [$recorded->first]);

        return $recorded;
    }

    public function update(int $clinicId, int $id, array $data, SeriesScope $scope): FinancialTransaction
    {
        $updated = $this->updateInScope($clinicId, $id, $data, $scope);
        $this->people->attachTo($clinicId, [$updated]);

        return $updated;
    }

    private function updateInScope(int $clinicId, int $id, array $data, SeriesScope $scope): FinancialTransaction
    {
        $transaction = $this->findForClinic($clinicId, $id);

        if (is_null($transaction->series_id)) {
            return $this->transactions->update($clinicId, $id, $data);
        }

        if ($scope === SeriesScope::Only) {
            $series = $this->seriesForClinic($clinicId, (int) $transaction->series_id);

            return $this->transactions->update($clinicId, $id, $this->withInstallmentNumber($transaction, $series, $data));
        }

        return DB::transaction(function () use ($clinicId, $id, $data, $transaction) {
            $series = $this->seriesForClinic($clinicId, (int) $transaction->series_id);
            if ($series->kind === FinancialSeriesKind::Recurrence) {
                // Na recorrência, "este e os próximos" divide a série (ADR 026).
                return $this->recurrences->splitFollowing($clinicId, $transaction, $data);
            }

            $changes = $this->sharedChanges($transaction, $series, $data);
            $updated = $this->transactions->update($clinicId, $id, $this->withInstallmentNumber($transaction, $series, $data));

            if (!empty($changes)) {
                // `pendingAfter` trava as parcelas: uma baixa ao mesmo tempo espera esta edição.
                foreach ($this->seriesRepository->pendingAfter($clinicId, (int) $series->id, (int) $transaction->series_index) as $next) {
                    if (!$this->stillPending((int) $next->id)) {
                        continue;
                    }
                    $this->transactions->update($clinicId, (int) $next->id, $this->changesFor($next, $series, $changes));
                }
            }

            return $updated;
        });
    }

    /**
     * Confere de novo antes de mexer: a parcela que recebeu baixa depois da busca fica com o valor
     * dela (no SQLite, o banco dos testes, o `lockForUpdate` não trava nada).
     */
    private function stillPending(int $id): bool
    {
        return $this->transactionRepository->find($id)?->status === FinancialTransactionStatus::Pendente;
    }

    /**
     * A parcela sempre leva o "(n/N)": quem reescreve a descrição sem ele não tira a numeração.
     *
     * @return array<string, mixed>
     */
    private function withInstallmentNumber(FinancialTransaction $transaction, FinancialSeries $series, array $data): array
    {
        if ($series->kind !== FinancialSeriesKind::Installments || !array_key_exists('description', $data)) {
            return $data;
        }

        $index = (int) $transaction->series_index;
        $total = (int) $series->installments_total;

        return [
            ...$data,
            'description' => $this->numbered($this->withoutNumber((string) $data['description'], $index, $total), $index, $total),
        ];
    }

    public function delete(int $clinicId, int $id, SeriesScope $scope): int
    {
        $transaction = $this->findForClinic($clinicId, $id);

        if ($scope === SeriesScope::Only || is_null($transaction->series_id)) {
            $this->transactions->softDelete($clinicId, $id);

            return 1;
        }

        return DB::transaction(function () use ($clinicId, $id, $transaction) {
            $series = $this->seriesForClinic($clinicId, (int) $transaction->series_id);

            if ($series->kind === FinancialSeriesKind::Recurrence) {
                // Encerra a repetição: o comando não gera mais nada nela. Trava a série antes das
                // ocorrências, na mesma ordem da divisão: as duas ao mesmo tempo não se travam (deadlock).
                $this->recurrences->endBefore($clinicId, $transaction);
            }
            $next = $this->seriesRepository->pendingAfter($clinicId, (int) $series->id, (int) $transaction->series_index);
            $this->transactions->softDelete($clinicId, $id);
            foreach ($next as $pending) {
                $this->transactions->softDelete($clinicId, (int) $pending->id);
            }

            return 1 + $next->count();
        });
    }

    private function recordInstallments(int $clinicId, array $data, int $total): RecordedTransactions
    {
        return DB::transaction(function () use ($clinicId, $data, $total) {
            $anchor      = CarbonImmutable::parse($data['date'])->startOfDay();
            $description = (string) $data['description'];
            $fee         = $data['fee_amount'] ?? 0;

            $series = $this->seriesRepository->create([
                'clinic_id'             => $clinicId,
                'kind'                  => FinancialSeriesKind::Installments,
                'anchor_date'           => $anchor->toDateString(),
                'installments_total'    => $total,
                'type'                  => $data['type'],
                'financial_category_id' => $data['financial_category_id'],
                'payment_method'        => $data['payment_method'],
                'description'           => $description,
                'gross_amount'          => $data['gross_amount'],
                'fee_amount'            => $fee,
                'notes'                 => $data['notes'] ?? null,
                'created_by_user_id'    => Auth::guard('clinic')->id(),
            ]);

            $first = null;
            foreach (InstallmentSplit::of($data['gross_amount'], $fee, $total) as $i => $amounts) {
                $index   = $i + 1;
                $created = $this->transactions->create($clinicId, [
                    ...$data,
                    // Do dia da 1ª, mês a mês: 31/01 → 28/02 → 31/03 (sem passar para o mês seguinte).
                    'date'         => $anchor->addMonthsNoOverflow($i)->toDateString(),
                    'description'  => $this->numbered($description, $index, $total),
                    'gross_amount' => $amounts['gross'],
                    'fee_amount'   => $amounts['fee'],
                    'status'       => $index === 1 ? $data['status'] : FinancialTransactionStatus::Pendente->value,
                    'series_id'    => $series->id,
                    'series_index' => $index,
                ]);
                $first ??= $created;
            }

            return new RecordedTransactions($first, $total);
        });
    }

    /**
     * Os campos de `SHARED_FIELDS` que mudaram nesta parcela. A descrição é comparada
     * sem o "(n/N)" que o sistema pôs nesta parcela, e os valores, em centavos.
     *
     * @return array<string, mixed>
     */
    private function sharedChanges(FinancialTransaction $transaction, FinancialSeries $series, array $data): array
    {
        $index   = (int) $transaction->series_index;
        $total   = (int) $series->installments_total;
        $changes = [];
        foreach (self::SHARED_FIELDS as $field) {
            if (!array_key_exists($field, $data)) {
                continue;
            }
            $new = $data[$field];
            $old = $transaction->getAttribute($field);

            $changed = match ($field) {
                'description'                 => $this->withoutNumber((string) $new, $index, $total) !== $this->withoutNumber((string) $old, $index, $total),
                'gross_amount', 'fee_amount'  => $this->cents($new) !== $this->cents($old),
                'financial_category_id'       => (int) $new !== (int) $old,
                'notes'                       => (empty($new) ? null : (string) $new) !== (empty($old) ? null : (string) $old),
                default                       => $this->enumValue($new) !== $this->enumValue($old),
            };

            if ($changed) {
                $changes[$field] = $field === 'description' ? $this->withoutNumber((string) $new, $index, $total) : $new;
            }
        }

        // Saída não tem paciente: as próximas que viram saída perdem o paciente e o atendimento.
        if (array_key_exists('type', $changes) && $this->enumValue($changes['type']) === FinancialTransactionType::Saida->value) {
            $changes['patient_id']     = null;
            $changes['appointment_id'] = null;
        }

        return $changes;
    }

    /**
     * @param  array<string, mixed>  $changes
     * @return array<string, mixed>
     */
    private function changesFor(FinancialTransaction $next, FinancialSeries $series, array $changes): array
    {
        if (array_key_exists('description', $changes) && $series->kind === FinancialSeriesKind::Installments) {
            $changes['description'] = $this->numbered($changes['description'], (int) $next->series_index, (int) $series->installments_total);
        }

        return $changes;
    }

    /**
     * A descrição como veio, com o "(n/N)" da parcela no fim. Na criação vai a digitada inteira:
     * um "Pacote (10/10)" da pessoa fica, e vira "Pacote (10/10) (1/3)".
     */
    private function numbered(string $description, int $index, int $total): string
    {
        $suffix = " ({$index}/{$total})";

        return mb_substr(trim($description), 0, 255 - mb_strlen($suffix)) . $suffix;
    }

    /**
     * Na edição, tira só o "(n/N)" que o sistema pôs nesta parcela: "Maca (4/10)" na 4ª de 10
     * → "Maca"; o "(10/10)" de "Pacote (10/10) (2/3)" fica.
     */
    private function withoutNumber(string $description, int $index, int $total): string
    {
        return trim((string) preg_replace('/\s*\(' . $index . '\/' . $total . '\)\s*$/u', '', $description));
    }

    private function enumValue(mixed $value): string
    {
        return $value instanceof \BackedEnum ? (string) $value->value : (string) $value;
    }

    private function cents(mixed $value): int
    {
        return (int) round(((float) $value) * 100);
    }

    private function findForClinic(int $clinicId, int $id): FinancialTransaction
    {
        $transaction = $this->transactionRepository->find($id);
        abort_if(is_null($transaction) || (int) $transaction->clinic_id !== $clinicId, 404);

        return $transaction;
    }

    private function seriesForClinic(int $clinicId, int $seriesId): FinancialSeries
    {
        $series = $this->seriesRepository->findForClinic($clinicId, $seriesId);
        abort_if(is_null($series), 404);

        return $series;
    }
}
