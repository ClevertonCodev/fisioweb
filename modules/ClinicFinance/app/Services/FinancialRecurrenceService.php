<?php

namespace Modules\ClinicFinance\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Modules\ClinicFinance\Contracts\FinancialRecurrenceServiceInterface;
use Modules\ClinicFinance\Contracts\FinancialSeriesRepositoryInterface;
use Modules\ClinicFinance\Contracts\FinancialTransactionServiceInterface;
use Modules\ClinicFinance\Data\RecordedTransactions;
use Modules\ClinicFinance\Data\RecurrenceGenerationResult;
use Modules\ClinicFinance\Data\TransactionRepeat;
use Modules\ClinicFinance\Enums\FinancialSeriesKind;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Models\FinancialSeries;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Modules\ClinicFinance\Support\RecurrenceSchedule;
use Throwable;

class FinancialRecurrenceService implements FinancialRecurrenceServiceInterface
{
    public function __construct(
        protected FinancialTransactionServiceInterface $transactions,
        protected FinancialSeriesRepositoryInterface $seriesRepository,
    ) {}

    public function start(int $clinicId, array $data, TransactionRepeat $repeat): RecordedTransactions
    {
        return DB::transaction(function () use ($clinicId, $data, $repeat) {
            $anchor = CarbonImmutable::parse($data['date'])->startOfDay();

            $series = $this->seriesRepository->create([
                'clinic_id'             => $clinicId,
                'kind'                  => FinancialSeriesKind::Recurrence,
                'frequency'             => $repeat->frequency,
                'anchor_date'           => $anchor->toDateString(),
                'anchor_day'            => $anchor->day,
                'ends_on'               => $repeat->endsOn?->toDateString(),
                'generated_until'       => $anchor->toDateString(),
                'type'                  => $data['type'],
                'financial_category_id' => $data['financial_category_id'],
                'payment_method'        => $data['payment_method'],
                'description'           => $data['description'],
                'gross_amount'          => $data['gross_amount'],
                'fee_amount'            => $data['fee_amount'] ?? 0,
                'notes'                 => $data['notes'] ?? null,
                'patient_id'            => $data['patient_id'] ?? null,
                'created_by_user_id'    => Auth::guard('clinic')->id(),
            ]);

            // A 1ª é o que a pessoa digitou (status e atendimento inclusive).
            $first = $this->transactions->create($clinicId, [
                ...$data,
                'series_id'    => $series->id,
                'series_index' => 1,
            ]);

            $created = $this->generate($series, RecurrenceSchedule::horizonFrom(CarbonImmutable::today()));

            return new RecordedTransactions($first, 1 + $created);
        });
    }

    public function generateDue(CarbonImmutable $today): RecurrenceGenerationResult
    {
        $horizon = RecurrenceSchedule::horizonFrom($today);
        $created = 0;
        $failed  = [];

        foreach ($this->seriesRepository->recurrenceIdsToGenerate($horizon) as $seriesId) {
            try {
                $created += DB::transaction(function () use ($seriesId, $horizon) {
                    // Travada: duas rodadas ao mesmo tempo não criam a mesma posição.
                    $series = $this->seriesRepository->lockRecurrence($seriesId);

                    return is_null($series) ? 0 : $this->generate($series, $horizon);
                });
            } catch (Throwable $e) {
                // Uma série com problema (categoria desligada, por exemplo) não para as outras.
                report($e);
                $failed[] = $seriesId;
            }
        }

        return new RecurrenceGenerationResult($created, $failed);
    }

    public function splitFollowing(int $clinicId, FinancialTransaction $occurrence, array $data): FinancialTransaction
    {
        return DB::transaction(function () use ($clinicId, $occurrence, $data) {
            // A série antes das ocorrências: a mesma ordem de trava da exclusão (sem deadlock).
            $old   = $this->lockedForClinic($clinicId, (int) $occurrence->series_id);
            $index = (int) $occurrence->series_index;
            // A regra não muda na edição: a nova segue com a frequência e o fim da antiga.
            $endsOn = $old->ends_on;
            // Travadas: a baixa de uma delas ao mesmo tempo espera, e a lida aqui é a situação de agora.
            $later = $this->seriesRepository->occurrencesAfter($clinicId, (int) $old->id, $index);

            $ruleDate = $this->scheduleOf($old)->dateAt($index);
            $stored   = CarbonImmutable::parse($occurrence->date)->startOfDay();

            $this->seriesRepository->endOn($old, $this->lastDateBefore($old, $index));
            $this->refreshNextOccurrence($old);

            $sent = CarbonImmutable::parse($data['date'])->startOfDay();
            // A pessoa não mudou o dia nesta edição (a data é a gravada, mesmo fora da regra por
            // um "só este" ou por uma divisão anterior) ou voltou à data da regra: a nova segue a
            // regra antiga, contada da data que a regra dá a esta posição. Senão, o dia novo vira a regra.
            $keepsRule = $sent->equalTo($stored) || $sent->equalTo($ruleDate);
            $anchor    = $keepsRule ? $ruleDate : $sent;
            $day       = $keepsRule ? $this->ruleDayOf($old) : $sent->day;
            $new       = $this->seriesRepository->create([
                'clinic_id'             => $clinicId,
                'kind'                  => FinancialSeriesKind::Recurrence,
                'frequency'             => $old->frequency,
                'anchor_date'           => $anchor->toDateString(),
                'anchor_day'            => $day,
                'ends_on'               => $this->endNotBefore($endsOn, $anchor, $sent)?->toDateString(),
                'generated_until'       => $sent->toDateString(),
                'type'                  => $data['type'],
                'financial_category_id' => $data['financial_category_id'],
                'payment_method'        => $data['payment_method'],
                'description'           => $data['description'],
                'gross_amount'          => $data['gross_amount'],
                'fee_amount'            => $data['fee_amount'] ?? 0,
                'notes'                 => array_key_exists('notes', $data) ? $data['notes'] : $old->notes,
                // Saída nunca leva paciente, mesmo sem o campo no pedido.
                'patient_id'            => $data['type'] === FinancialTransactionType::Saida->value
                    ? null
                    : (array_key_exists('patient_id', $data) ? $data['patient_id'] : $old->patient_id),
                'created_by_user_id'    => Auth::guard('clinic')->id() ?? $old->created_by_user_id,
            ]);

            $updated = $this->transactions->update($clinicId, (int) $occurrence->id, [
                ...$data,
                'series_id'    => $new->id,
                'series_index' => 1,
            ]);

            // Mesma posição na nova (a 5ª da antiga, contada desta, é a 3ª da nova).
            $taken = [1];
            foreach ($later as $next) {
                if (!$next->trashed() && $next->status === FinancialTransactionStatus::Pendente) {
                    $this->transactions->softDelete($clinicId, (int) $next->id);

                    continue;
                }
                $slot = (int) $next->series_index - $index + 1;
                $this->seriesRepository->moveToSeries($next, (int) $new->id, $slot);
                $taken[] = $slot;
            }

            $this->generate($new, RecurrenceSchedule::horizonFrom(CarbonImmutable::today()), 2, $taken);

            return $updated;
        });
    }

    public function endBefore(int $clinicId, FinancialTransaction $occurrence): void
    {
        DB::transaction(function () use ($clinicId, $occurrence) {
            $series = $this->lockedForClinic($clinicId, (int) $occurrence->series_id);
            $this->seriesRepository->endOn($series, $this->lastDateBefore($series, (int) $occurrence->series_index));
            $this->refreshNextOccurrence($series);
        });
    }

    /**
     * Onde a série termina para não chegar à posição `$index`: a data da ocorrência
     * anterior pela regra (a véspera da 1ª, quando é a 1ª). Um fim que já vinha antes fica.
     */
    private function lastDateBefore(FinancialSeries $series, int $index): CarbonImmutable
    {
        $end = $index > 1
            ? $this->scheduleOf($series)->dateAt($index - 1)
            : CarbonImmutable::parse($series->anchor_date)->startOfDay()->subDay();

        if (!is_null($series->ends_on)) {
            $current = CarbonImmutable::parse($series->ends_on)->startOfDay();
            if ($current->lessThan($end)) {
                return $current;
            }
        }

        return $end;
    }

    /**
     * O fim da série nova: o da antiga, mas nunca antes da 1ª dela (a data levada para depois
     * do fim estica o fim até ela, e a nova não gera mais nada). Nulo = sem fim.
     */
    private function endNotBefore(?\DateTimeInterface $endsOn, CarbonImmutable $anchor, CarbonImmutable $first): ?CarbonImmutable
    {
        if (is_null($endsOn)) {
            return null;
        }

        return CarbonImmutable::parse($endsOn)->startOfDay()->max($anchor)->max($first);
    }

    private function lockedForClinic(int $clinicId, int $seriesId): FinancialSeries
    {
        $series = $this->seriesRepository->lockRecurrence($seriesId);
        abort_if(is_null($series) || (int) $series->clinic_id !== $clinicId, 404);

        return $series;
    }

    private function scheduleOf(FinancialSeries $series): RecurrenceSchedule
    {
        return new RecurrenceSchedule(
            anchor: CarbonImmutable::parse($series->anchor_date)->startOfDay(),
            frequency: $series->frequency,
            endsOn: is_null($series->ends_on) ? null : CarbonImmutable::parse($series->ends_on)->startOfDay(),
            day: $this->ruleDayOf($series),
        );
    }

    /** O dia do mês da regra: o guardado, ou o da 1ª. */
    private function ruleDayOf(FinancialSeries $series): int
    {
        return $series->anchor_day ?? CarbonImmutable::parse($series->anchor_date)->day;
    }

    /**
     * Guarda a data da próxima posição ainda não criada (nula quando ela passa do fim):
     * é por ela que o comando diário escolhe quais séries travar.
     */
    private function refreshNextOccurrence(FinancialSeries $series, ?int $lastIndex = null): void
    {
        $lastIndex ??= $this->seriesRepository->lastIndex((int) $series->clinic_id, (int) $series->id);

        $this->seriesRepository->markNextOccurrenceOn($series, $this->scheduleOf($series)->dateWithinEndAt($lastIndex + 1));
    }

    /**
     * Cria, a partir dos dados-modelo da série e com o `clinic_id` dela, as ocorrências
     * depois da última já criada (inclusive as da lixeira, que não voltam) até antes do
     * horizonte, pendentes, e avança o `generated_until` e a próxima data devida.
     *
     * @param  int|null  $fromIndex  de onde começar (padrão: depois da última já criada)
     * @param  list<int>  $taken  posições que já têm lançamento e não são criadas
     */
    private function generate(FinancialSeries $series, CarbonImmutable $horizon, ?int $fromIndex = null, array $taken = []): int
    {
        $clinicId  = (int) $series->clinic_id;
        $schedule  = $this->scheduleOf($series);
        $fromIndex ??= $this->seriesRepository->lastIndex($clinicId, (int) $series->id) + 1;

        $occurrences = array_diff_key($schedule->occurrencesFrom($fromIndex, $horizon), array_flip($taken));

        foreach ($occurrences as $index => $date) {
            $this->transactions->create($clinicId, [
                'type'                  => $series->type->value,
                'financial_category_id' => (int) $series->financial_category_id,
                'payment_method'        => $series->payment_method->value,
                'description'           => $series->description,
                'gross_amount'          => $series->gross_amount,
                'fee_amount'            => $series->fee_amount,
                'notes'                 => $series->notes,
                'patient_id'            => $series->patient_id,
                'status'                => FinancialTransactionStatus::Pendente->value,
                'date'                  => $date->toDateString(),
                'series_id'             => $series->id,
                'series_index'          => $index,
                'created_by_user_id'    => $series->created_by_user_id,
            ]);
        }

        if (!empty($occurrences)) {
            $this->seriesRepository->markGeneratedUntil($series, end($occurrences));
        }
        // A maior posição criada: as de antes de `$fromIndex`, as que já tinham lançamento e as de agora.
        // Em array, porque sem nada criado agora (anual de hoje, fim antes da 2ª) o `max` recebe um valor só.
        $this->refreshNextOccurrence($series, max([$fromIndex - 1, ...$taken, ...array_keys($occurrences)]));

        return count($occurrences);
    }
}
