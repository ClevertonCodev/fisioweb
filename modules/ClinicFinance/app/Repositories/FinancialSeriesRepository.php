<?php

namespace Modules\ClinicFinance\Repositories;

use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Modules\ClinicFinance\Contracts\FinancialSeriesRepositoryInterface;
use Modules\ClinicFinance\Enums\FinancialSeriesKind;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Models\FinancialSeries;
use Modules\ClinicFinance\Models\FinancialTransaction;

class FinancialSeriesRepository implements FinancialSeriesRepositoryInterface
{
    public function __construct(
        protected FinancialSeries $model,
        protected FinancialTransaction $transactions,
    ) {}

    public function create(array $data): FinancialSeries
    {
        return $this->model->create($data);
    }

    public function findForClinic(int $clinicId, int $id): ?FinancialSeries
    {
        return $this->model->newQuery()->forClinic($clinicId)->find($id);
    }

    public function pendingAfter(int $clinicId, int $seriesId, int $afterIndex): Collection
    {
        return $this->transactions->newQuery()
            ->forClinic($clinicId)
            ->where('series_id', $seriesId)
            ->where('series_index', '>', $afterIndex)
            ->where('status', FinancialTransactionStatus::Pendente->value)
            ->orderBy('series_index')
            // Dentro da transação de "esta e as próximas": a baixa de uma delas ao mesmo tempo
            // espera, e a parcela paga não recebe o valor novo.
            ->lockForUpdate()
            ->get();
    }

    public function recurrenceIdsToGenerate(CarbonImmutable $horizon): LazyCollection
    {
        return $this->model->newQuery()
            ->where('kind', FinancialSeriesKind::Recurrence->value)
            ->whereNotNull('next_occurrence_on')
            ->where('next_occurrence_on', '<', $horizon->toDateString())
            ->where(fn ($q) => $q->whereNull('ends_on')->orWhereColumn('next_occurrence_on', '<=', 'ends_on'))
            ->lazyById(200, 'id')
            ->map(fn (FinancialSeries $series) => (int) $series->id);
    }

    public function lockRecurrence(int $id): ?FinancialSeries
    {
        return $this->model->newQuery()
            ->where('kind', FinancialSeriesKind::Recurrence->value)
            ->lockForUpdate()
            ->find($id);
    }

    public function lastIndex(int $clinicId, int $seriesId): int
    {
        return (int) $this->transactions->newQuery()
            ->withTrashed()
            ->forClinic($clinicId)
            ->where('series_id', $seriesId)
            ->max('series_index');
    }

    public function markGeneratedUntil(FinancialSeries $series, CarbonImmutable $date): void
    {
        $series->forceFill(['generated_until' => $date->toDateString()])->save();
    }

    public function markNextOccurrenceOn(FinancialSeries $series, ?CarbonImmutable $date): void
    {
        $series->forceFill(['next_occurrence_on' => $date?->toDateString()])->save();
    }

    public function occurrencesAfter(int $clinicId, int $seriesId, int $afterIndex): Collection
    {
        return $this->transactions->newQuery()
            ->withTrashed()
            ->forClinic($clinicId)
            ->where('series_id', $seriesId)
            ->where('series_index', '>', $afterIndex)
            ->orderBy('series_index')
            // Dentro da divisão, depois de travar a série: a baixa de uma delas ao mesmo tempo
            // espera, e a situação lida aqui é a de agora.
            ->lockForUpdate()
            ->get();
    }

    public function moveToSeries(FinancialTransaction $transaction, int $seriesId, int $index): void
    {
        $transaction->forceFill(['series_id' => $seriesId, 'series_index' => $index])->save();
    }

    public function endOn(FinancialSeries $series, CarbonImmutable $date): void
    {
        $series->forceFill(['ends_on' => $date->toDateString()])->save();
    }
}
