<?php

namespace Modules\ClinicFinance\Contracts;

use Illuminate\Support\Collection;
use Modules\ClinicFinance\Models\FinancialAttachment;

interface FinancialAttachmentRepositoryInterface
{
    /**
     * O lançamento da clínica fora da lixeira existe? Com `$lock`, trava a linha
     * até o fim da transação (o limite de 5 não estoura com dois envios juntos).
     */
    public function openTransactionExists(int $clinicId, int $transactionId, bool $lock = false): bool;

    /** @return Collection<int, FinancialAttachment> */
    public function listForTransaction(int $clinicId, int $transactionId): Collection;

    public function countForTransaction(int $clinicId, int $transactionId): int;

    public function findForTransaction(int $clinicId, int $transactionId, int $attachmentId): ?FinancialAttachment;

    public function create(array $data): FinancialAttachment;

    public function delete(FinancialAttachment $attachment): void;
}
