<?php

namespace Modules\ClinicFinance\Contracts;

interface FinanceCalendarServiceInterface
{
    /**
     * Entrou e saiu (líquido, todos os status) por dia do mês, só os dias com lançamento.
     *
     * @return array{period: string, days: array<int, array{date: string, income: float, expense: float}>}
     */
    public function month(int $clinicId, string $period): array;
}
