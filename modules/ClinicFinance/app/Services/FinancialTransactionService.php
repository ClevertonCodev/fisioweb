<?php

namespace Modules\ClinicFinance\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Validation\ValidationException;
use Modules\ClinicFinance\Contracts\FinancialCategoryRepositoryInterface;
use Modules\ClinicFinance\Contracts\FinancialTransactionRepositoryInterface;
use Modules\ClinicFinance\Contracts\FinancialTransactionServiceInterface;
use Modules\ClinicFinance\Contracts\TransactionPeopleServiceInterface;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Events\FinancialTransactionDeleted;
use Modules\ClinicFinance\Events\FinancialTransactionRecorded;
use Modules\ClinicFinance\Events\FinancialTransactionUpdated;
use Modules\ClinicFinance\Models\FinancialTransaction;

class FinancialTransactionService implements FinancialTransactionServiceInterface
{
    public function __construct(
        protected FinancialTransactionRepositoryInterface $repository,
        protected FinancialCategoryRepositoryInterface $categoryRepository,
        protected TransactionPeopleServiceInterface $people,
    ) {}

    public function list(int $clinicId, array $filters = []): LengthAwarePaginator
    {
        $paginator = $this->repository->paginateForClinic($clinicId, $this->withPatientSearch($clinicId, $filters));
        $this->people->attachTo($clinicId, $paginator->items());

        return $paginator;
    }

    /**
     * A busca (`q`) também acha pelo nome do paciente: os ids vêm do contrato de Patient e o
     * repositório só filtra por eles. Sempre sobrescreve `q_patient_ids` (não vem do cliente).
     */
    private function withPatientSearch(int $clinicId, array $filters): array
    {
        $term = is_string($filters['q'] ?? null) ? trim($filters['q']) : '';

        return [
            ...$filters,
            // `empty` como o repositório: lá um `q` vazio (ou "0") não filtra nada.
            'q_patient_ids' => empty($term) ? [] : $this->people->patientIdsMatching($clinicId, $term),
        ];
    }

    public function pendingNetTotal(int $clinicId, array $filters = []): ?float
    {
        if (empty($filters['overdue_until'])) {
            return null;
        }

        return $this->repository->sumNetForClinic($clinicId, $this->withPatientSearch($clinicId, $filters));
    }

    public function listTrash(int $clinicId, array $filters = []): LengthAwarePaginator
    {
        $paginator = $this->repository->paginateTrashedForClinic($clinicId, $this->withPatientSearch($clinicId, $filters));
        $this->people->attachTo($clinicId, $paginator->items());

        return $paginator;
    }

    public function show(int $clinicId, int $id): FinancialTransaction
    {
        $transaction = $this->repository->findOrFail($id);
        abort_if((int) $transaction->clinic_id !== $clinicId, 404);

        $transaction->load(['category', 'createdBy:id,name']);
        $this->people->attachTo($clinicId, [$transaction]);

        return $transaction;
    }

    public function create(int $clinicId, array $data): FinancialTransaction
    {
        $category = $this->categoryRepository->findAvailableForClinic($clinicId, (int) $data['financial_category_id']);
        abort_if(is_null($category), 422, 'Categoria inválida para esta clínica.');

        $gross = (float) $data['gross_amount'];
        $fee   = (float) ($data['fee_amount'] ?? 0);

        $transaction = $this->repository->create([
            ...$data,
            'clinic_id'          => $clinicId,
            'net_amount'         => FinancialTransaction::computeNetAmount($gross, $fee),
            // Sem usuário logado (o comando diário da recorrência), quem criou a série.
            'created_by_user_id' => Auth::guard('clinic')->id() ?? ($data['created_by_user_id'] ?? null),
        ]);

        $transaction = $transaction->load(['category', 'createdBy:id,name']);

        $event = new FinancialTransactionRecorded(
            version: 1,
            transactionId: (int) $transaction->id,
            clinicId: (int) $transaction->clinic_id,
            actorId: Auth::guard('clinic')->id(),
            type: $transaction->type->value,
            status: $transaction->status->value,
            amount: (string) $transaction->gross_amount,
            date: $transaction->date->toDateString(),
            categoryId: $transaction->financial_category_id ? (int) $transaction->financial_category_id : null,
            occurredAt: now()->toImmutable(),
        );

        DB::afterCommit(fn () => Event::dispatch($event));

        return $transaction;
    }

    public function update(int $clinicId, int $id, array $data): FinancialTransaction
    {
        $transaction = $this->repository->findOrFail($id);
        abort_if((int) $transaction->clinic_id !== $clinicId, 404);

        if (isset($data['financial_category_id'])) {
            $category = $this->categoryRepository->findAvailableForClinic($clinicId, (int) $data['financial_category_id']);
            abort_if(is_null($category), 422, 'Categoria inválida para esta clínica.');
        }

        $gross              = (float) ($data['gross_amount'] ?? $transaction->gross_amount);
        $fee                = (float) ($data['fee_amount'] ?? $transaction->fee_amount);
        $data['net_amount'] = FinancialTransaction::computeNetAmount($gross, $fee);

        $changedFields = array_keys($data);
        $updated       = $this->repository->update($id, $data);

        $event = new FinancialTransactionUpdated(
            version: 1,
            transactionId: (int) $updated->id,
            clinicId: (int) $updated->clinic_id,
            actorId: Auth::guard('clinic')->id(),
            changedFields: $changedFields,
            status: $updated->status->value,
            amount: (string) $updated->gross_amount,
            date: $updated->date->toDateString(),
            occurredAt: now()->toImmutable(),
        );

        DB::afterCommit(fn () => Event::dispatch($event));

        return $updated;
    }

    public function changeStatus(int $clinicId, int $id, FinancialTransactionStatus $status): FinancialTransaction
    {
        $updated = DB::transaction(function () use ($clinicId, $id, $status) {
            // Travado: a divisão ou a exclusão da série ao mesmo tempo espera esta baixa (ou esta
            // espera por ela), e o que já foi para a lixeira responde 404 em vez de receber a baixa.
            $transaction = $this->repository->findLocked($id);
            abort_if(is_null($transaction) || (int) $transaction->clinic_id !== $clinicId, 404);

            if (!$status->isValidFor($transaction->type)) {
                throw ValidationException::withMessages([
                    'status' => 'Status inválido para o tipo de transação informado.',
                ]);
            }

            $updated = $this->repository->update($id, ['status' => $status]);

            $event = new FinancialTransactionUpdated(
                version: 1,
                transactionId: (int) $updated->id,
                clinicId: (int) $updated->clinic_id,
                actorId: Auth::guard('clinic')->id(),
                changedFields: ['status'],
                status: $updated->status->value,
                amount: (string) $updated->gross_amount,
                date: $updated->date->toDateString(),
                occurredAt: now()->toImmutable(),
            );

            DB::afterCommit(fn () => Event::dispatch($event));

            return $updated;
        });

        $this->people->attachTo($clinicId, [$updated]);

        return $updated;
    }

    public function softDelete(int $clinicId, int $id): void
    {
        $transaction = $this->repository->findOrFail($id);
        abort_if((int) $transaction->clinic_id !== $clinicId, 404);

        $actorId = Auth::guard('clinic')->id();
        $this->repository->softDelete($transaction, (int) $actorId);

        $event = new FinancialTransactionDeleted(
            version: 1,
            transactionId: (int) $transaction->id,
            clinicId: (int) $transaction->clinic_id,
            actorId: $actorId,
            occurredAt: now()->toImmutable(),
        );

        DB::afterCommit(fn () => Event::dispatch($event));
    }

    public function restore(int $clinicId, int $id): FinancialTransaction
    {
        $transaction = $this->repository->findTrashed($id);
        abort_if(is_null($transaction) || (int) $transaction->clinic_id !== $clinicId, 404);

        $restored = $this->repository->restore($transaction);
        $this->people->attachTo($clinicId, [$restored]);

        return $restored;
    }
}
