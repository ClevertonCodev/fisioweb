<?php

namespace Modules\ClinicFinance\Console\Commands;

use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Modules\ClinicFinance\Contracts\FinancialRecurrenceServiceInterface;

/**
 * Roda todo dia: cria as próximas ocorrências das recorrências até 12 meses à
 * frente de hoje. Rodar de novo no mesmo dia não cria nada.
 */
class GenerateRecurringTransactionsCommand extends Command
{
    protected $signature = 'clinic-finance:generate-recurrences';

    protected $description = 'Cria as próximas ocorrências dos lançamentos recorrentes até 12 meses à frente.';

    public function handle(FinancialRecurrenceServiceInterface $recurrences): int
    {
        $result = $recurrences->generateDue(CarbonImmutable::today());

        $this->info("{$result->created} ocorrência(s) criada(s).");

        if (!empty($result->failedSeriesIds)) {
            $this->error('Séries que falharam: ' . implode(', ', $result->failedSeriesIds) . '.');

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
