<?php

namespace Modules\ClinicFinance\Contracts;

use Carbon\CarbonImmutable;
use Modules\ClinicFinance\Data\RecordedTransactions;
use Modules\ClinicFinance\Data\RecurrenceGenerationResult;
use Modules\ClinicFinance\Data\TransactionRepeat;
use Modules\ClinicFinance\Models\FinancialTransaction;

/**
 * Lançamento recorrente (semanal, mensal ou anual): cria a série e as ocorrências
 * até 12 meses à frente de hoje, e gera as próximas conforme o tempo passa.
 */
interface FinancialRecurrenceServiceInterface
{
    /**
     * Cria a série e as ocorrências até 12 meses à frente de hoje, sem passar do fim:
     * a 1ª com a data e o status escolhidos, as seguintes pendentes com os mesmos dados.
     */
    public function start(int $clinicId, array $data, TransactionRepeat $repeat): RecordedTransactions;

    /**
     * Para cada recorrência ativa, de todas as clínicas, cria as ocorrências que
     * faltam até 12 meses à frente de `$today`. Rodar de novo não duplica.
     */
    public function generateDue(CarbonImmutable $today): RecurrenceGenerationResult;

    /**
     * "Este e os próximos" na edição de uma ocorrência: divide a série. A antiga
     * termina na ocorrência anterior; nasce uma série nova a partir desta, com os
     * dados novos e a mesma regra (frequência e fim). Esta vira a 1ª da nova; as
     * próximas pendentes da antiga vão para a lixeira e são geradas de novo na nova;
     * as pagas/recebidas (e as que já estavam na lixeira) passam para a nova sem mudar.
     */
    public function splitFollowing(int $clinicId, FinancialTransaction $occurrence, array $data): FinancialTransaction;

    /**
     * "Este e os próximos" na exclusão: a série termina na ocorrência anterior a
     * esta, e o comando não gera mais nada nela. Quem manda as ocorrências para a
     * lixeira é quem chama.
     */
    public function endBefore(int $clinicId, FinancialTransaction $occurrence): void;
}
