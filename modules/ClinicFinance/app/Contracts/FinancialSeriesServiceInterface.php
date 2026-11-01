<?php

namespace Modules\ClinicFinance\Contracts;

use Modules\ClinicFinance\Data\RecordedTransactions;
use Modules\ClinicFinance\Data\TransactionRepeat;
use Modules\ClinicFinance\Enums\SeriesScope;
use Modules\ClinicFinance\Models\FinancialTransaction;

/**
 * Lançamento com "Repetir": cria a série (parcelamento) e aplica "só esta" ou
 * "esta e as próximas" na edição e na exclusão. Lançamento avulso passa direto
 * para o `FinancialTransactionServiceInterface`.
 */
interface FinancialSeriesServiceInterface
{
    /**
     * Sem repetição, cria um lançamento. Parcelado em N vezes, cria N lançamentos,
     * um por mês a partir da data, "Descrição (n/N)", valor e taxa divididos (o
     * centavo que sobra vai na 1ª), a 1ª com o status escolhido e as outras pendentes.
     * O primeiro lançamento volta com paciente e atendimento preenchidos.
     */
    public function record(int $clinicId, array $data, TransactionRepeat $repeat): RecordedTransactions;

    /**
     * `following` numa parcela: esta recebe tudo, e as próximas pendentes recebem o que
     * mudou nesta (tipo, categoria, forma de pagamento, descrição, observação, valor e
     * taxa); data e status ficam. Numa recorrência, `following` divide a série
     * (`FinancialRecurrenceServiceInterface::splitFollowing`). Fora de série, ou com
     * `only`, muda só esta. A parcela sempre fica com o "(n/N)" na descrição, e as próximas
     * que viram saída perdem paciente e atendimento. Volta com paciente e atendimento preenchidos.
     */
    public function update(int $clinicId, int $id, array $data, SeriesScope $scope): FinancialTransaction;

    /**
     * `following` numa parcela: esta e as próximas pendentes vão para a lixeira. Numa
     * recorrência, também encerra a série na ocorrência anterior (nada mais é gerado).
     * Devolve quantos lançamentos foram para a lixeira.
     */
    public function delete(int $clinicId, int $id, SeriesScope $scope): int;
}
