<?php

namespace Modules\ClinicFinance\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Models\FinancialTransaction;

interface FinancialTransactionServiceInterface
{
    public function list(int $clinicId, array $filters = []): LengthAwarePaginator;

    /**
     * Total líquido de "a receber"/"a pagar" (todas as páginas) quando a listagem pede `overdue_until`;
     * `null` nas outras listagens.
     */
    public function pendingNetTotal(int $clinicId, array $filters = []): ?float;

    public function listTrash(int $clinicId, array $filters = []): LengthAwarePaginator;

    /** O lançamento com categoria, quem lançou (`id`, `name`), paciente e atendimento. 404 se é de outra clínica. */
    public function show(int $clinicId, int $id): FinancialTransaction;

    /**
     * Grava um lançamento da clínica (422 se a categoria não serve para ela) e devolve com
     * categoria e quem lançou, **sem** paciente e atendimento preenchidos: é o passo interno
     * da série (`FinancialSeriesService`, `FinancialRecurrenceService`), e quem responde à
     * API preenche com `TransactionPeopleServiceInterface::attachTo`.
     */
    public function create(int $clinicId, array $data): FinancialTransaction;

    /**
     * Muda o lançamento da clínica (404 se é de outra) e recalcula o líquido. Devolve **sem**
     * paciente e atendimento preenchidos, como o `create`: quem responde à API preenche.
     */
    public function update(int $clinicId, int $id, array $data): FinancialTransaction;

    /**
     * Baixa em um clique (e o "Desfazer"): muda só o status, com a linha travada. 404 se o
     * lançamento é de outra clínica ou já está na lixeira (uma divisão ou exclusão da série ao
     * mesmo tempo); 422 se o status não vale para o tipo (entrada: recebido/pendente; saída: pago/pendente).
     * Devolve com paciente e atendimento preenchidos.
     */
    public function changeStatus(int $clinicId, int $id, FinancialTransactionStatus $status): FinancialTransaction;

    public function softDelete(int $clinicId, int $id): void;

    /** Tira da lixeira e devolve com paciente e atendimento preenchidos. 404 se é de outra clínica. */
    public function restore(int $clinicId, int $id): FinancialTransaction;
}
