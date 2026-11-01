<?php

namespace Modules\ClinicFinance\Repositories;

use Illuminate\Support\Collection;
use Modules\ClinicFinance\Contracts\FinancialAttachmentRepositoryInterface;
use Modules\ClinicFinance\Models\FinancialAttachment;
use Modules\ClinicFinance\Models\FinancialTransaction;

class FinancialAttachmentRepository implements FinancialAttachmentRepositoryInterface
{
    public function __construct(
        protected FinancialAttachment $model,
        protected FinancialTransaction $transactions,
    ) {}

    public function openTransactionExists(int $clinicId, int $transactionId, bool $lock = false): bool
    {
        // O escopo de SoftDeletes deixa de fora o lançamento na lixeira.
        return $this->transactions->newQuery()
            ->forClinic($clinicId)
            ->whereKey($transactionId)
            ->when($lock, fn ($query) => $query->lockForUpdate())
            ->exists();
    }

    public function listForTransaction(int $clinicId, int $transactionId): Collection
    {
        return $this->forTransaction($clinicId, $transactionId)->orderBy('id')->get();
    }

    public function countForTransaction(int $clinicId, int $transactionId): int
    {
        return $this->forTransaction($clinicId, $transactionId)->count();
    }

    public function findForTransaction(int $clinicId, int $transactionId, int $attachmentId): ?FinancialAttachment
    {
        return $this->forTransaction($clinicId, $transactionId)->whereKey($attachmentId)->first();
    }

    public function create(array $data): FinancialAttachment
    {
        return $this->model->newQuery()->create($data);
    }

    public function delete(FinancialAttachment $attachment): void
    {
        $attachment->delete();
    }

    private function forTransaction(int $clinicId, int $transactionId)
    {
        return $this->model->newQuery()
            ->forClinic($clinicId)
            ->where('financial_transaction_id', $transactionId);
    }
}
