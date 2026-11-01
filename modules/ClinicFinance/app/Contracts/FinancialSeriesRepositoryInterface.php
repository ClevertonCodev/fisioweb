<?php

namespace Modules\ClinicFinance\Contracts;

use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Modules\ClinicFinance\Models\FinancialSeries;
use Modules\ClinicFinance\Models\FinancialTransaction;

interface FinancialSeriesRepositoryInterface
{
    public function create(array $data): FinancialSeries;

    /** A série, só se for da clínica. */
    public function findForClinic(int $clinicId, int $id): ?FinancialSeries;

    /**
     * As parcelas/ocorrências pendentes da série depois da posição `$afterIndex`,
     * da clínica, fora da lixeira, em ordem.
     *
     * @return Collection<int, FinancialTransaction>
     */
    public function pendingAfter(int $clinicId, int $seriesId, int $afterIndex): Collection;

    /**
     * Ids das recorrências de todas as clínicas com ocorrência nova para criar: a
     * próxima (`next_occurrence_on`) cai antes do horizonte e não passa do fim.
     *
     * @return LazyCollection<int, int>
     */
    public function recurrenceIdsToGenerate(CarbonImmutable $horizon): LazyCollection;

    /** A recorrência, travada para gerar (dentro de uma transação). */
    public function lockRecurrence(int $id): ?FinancialSeries;

    /** A maior posição já criada na série, contando as da lixeira (0 sem nenhuma). */
    public function lastIndex(int $clinicId, int $seriesId): int;

    public function markGeneratedUntil(FinancialSeries $series, CarbonImmutable $date): void;

    /** A data da próxima ocorrência ainda não criada (nula = a repetição acabou). */
    public function markNextOccurrenceOn(FinancialSeries $series, ?CarbonImmutable $date): void;

    /**
     * Todas as ocorrências da série depois da posição `$afterIndex`, da clínica, de
     * qualquer situação e também as da lixeira, em ordem, travadas para a divisão
     * (dentro de uma transação, depois de travar a série).
     *
     * @return Collection<int, FinancialTransaction>
     */
    public function occurrencesAfter(int $clinicId, int $seriesId, int $afterIndex): Collection;

    /** Passa o lançamento (mesmo na lixeira) para outra série, na posição dada, sem mudar mais nada. */
    public function moveToSeries(FinancialTransaction $transaction, int $seriesId, int $index): void;

    /** A repetição acaba em `$date` (inclusive): a geração não passa dela. */
    public function endOn(FinancialSeries $series, CarbonImmutable $date): void;
}
