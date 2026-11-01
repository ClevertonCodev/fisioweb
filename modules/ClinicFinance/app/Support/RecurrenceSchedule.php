<?php

namespace Modules\ClinicFinance\Support;

use Carbon\CarbonImmutable;
use Modules\ClinicFinance\Enums\RecurrenceFrequency;

/**
 * As datas de uma recorrência: da 1ª (`anchor`), na frequência, até antes do
 * horizonte (12 meses à frente de hoje) e sem passar do fim (`endsOn`, nulo = sem fim).
 */
final readonly class RecurrenceSchedule
{
    /** Até quantos meses à frente de hoje as ocorrências ficam criadas. */
    public const MONTHS_AHEAD = 12;

    public function __construct(
        public CarbonImmutable $anchor,
        public RecurrenceFrequency $frequency,
        public ?CarbonImmutable $endsOn = null,
        // Dia da regra no mensal e no anual (nulo = o dia da 1ª).
        public ?int $day = null,
    ) {}

    /** O horizonte da geração: as ocorrências vão até antes dele. */
    public static function horizonFrom(CarbonImmutable $today): CarbonImmutable
    {
        return $today->startOfDay()->addMonthsNoOverflow(self::MONTHS_AHEAD);
    }

    /**
     * As ocorrências a partir da posição `$fromIndex` (1 = a 1ª) que cabem antes do
     * horizonte e até o fim.
     *
     * @return array<int, CarbonImmutable> posição => data
     */
    public function occurrencesFrom(int $fromIndex, CarbonImmutable $horizon): array
    {
        $dates = [];
        for ($index = max(1, $fromIndex); ; $index++) {
            $date = $this->dateAt($index);
            if ($date->greaterThanOrEqualTo($horizon) || $this->isPastTheEnd($date)) {
                return $dates;
            }
            $dates[$index] = $date;
        }
    }

    /** A data da posição `$index` (1 = a 1ª) pela regra, sem olhar o fim. */
    public function dateAt(int $index): CarbonImmutable
    {
        return $this->frequency->dateAt($this->anchor, $index - 1, $this->day);
    }

    /** A data da posição `$index`, ou nula se ela passa do fim (a repetição acabou antes dela). */
    public function dateWithinEndAt(int $index): ?CarbonImmutable
    {
        $date = $this->dateAt($index);

        return $this->isPastTheEnd($date) ? null : $date;
    }

    private function isPastTheEnd(CarbonImmutable $date): bool
    {
        return !is_null($this->endsOn) && $date->greaterThan($this->endsOn);
    }
}
