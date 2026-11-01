<?php

namespace Modules\ClinicFinance\Enums;

use Carbon\CarbonImmutable;

/** De quanto em quanto a recorrência se repete. */
enum RecurrenceFrequency: string
{
    case Weekly  = 'weekly';
    case Monthly = 'monthly';
    case Yearly  = 'yearly';

    /**
     * A data da ocorrência `$offset` (0 = a 1ª), sempre contada da 1ª: no mensal, 31/01
     * cai em 28/02 e volta a 31/03; no anual, 29/02 cai em 28/02 e volta a 29/02 no
     * próximo bissexto.
     *
     * `$day` é o dia da regra quando ele não é o dia da 1ª: a série que nasce de uma
     * edição em 28/02 de um "todo dia 31" começa em 28/02 e segue no 31 (nulo = o dia da 1ª).
     */
    public function dateAt(CarbonImmutable $anchor, int $offset, ?int $day = null): CarbonImmutable
    {
        $month = match ($this) {
            self::Weekly  => null,
            self::Monthly => $anchor->startOfMonth()->addMonths($offset),
            self::Yearly  => $anchor->startOfMonth()->addYears($offset),
        };

        if (is_null($month)) {
            return $anchor->addWeeks($offset);
        }

        return $month->setDay(min($day ?? $anchor->day, $month->daysInMonth));
    }
}
