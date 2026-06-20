<?php

namespace Modules\Clinic\Repositories;

use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Modules\Clinic\Contracts\FinancialTransactionRepositoryInterface;
use Modules\Clinic\Enums\FinancialTransactionStatus;
use Modules\Clinic\Enums\FinancialTransactionType;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\FinancialTransaction;

class FinancialTransactionRepository implements FinancialTransactionRepositoryInterface
{
    public function __construct(
        protected FinancialTransaction $model,
    ) {}

    public function find(int $id): ?FinancialTransaction
    {
        return $this->model->find($id);
    }

    public function findOrFail(int $id): FinancialTransaction
    {
        return $this->model->findOrFail($id);
    }

    public function findTrashed(int $id): ?FinancialTransaction
    {
        return $this->model->onlyTrashed()->find($id);
    }

    public function create(array $data): FinancialTransaction
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): FinancialTransaction
    {
        $transaction = $this->findOrFail($id);
        $transaction->update($data);

        return $transaction->refresh()->load(['category', 'createdBy', 'deletedBy']);
    }

    public function softDelete(FinancialTransaction $transaction, int $deletedByUserId): void
    {
        $transaction->deleted_by_user_id = $deletedByUserId;
        $transaction->save();
        $transaction->delete();
    }

    public function restore(FinancialTransaction $transaction): FinancialTransaction
    {
        $transaction->deleted_by_user_id = null;
        $transaction->save();
        $transaction->restore();

        return $transaction->refresh()->load(['category', 'createdBy']);
    }

    public function paginateForClinic(int $clinicId, array $filters = []): LengthAwarePaginator
    {
        $query = $this->baseQuery($clinicId, $filters)
            ->with(['category', 'createdBy']);

        return $this->paginateSorted($query, $filters);
    }

    public function paginateTrashedForClinic(int $clinicId, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->onlyTrashed()
            ->forClinic($clinicId)
            ->with(['category', 'deletedBy']);

        $this->applyPeriodFilter($query, $clinicId, $filters);
        $this->applySearchFilter($query, $filters);

        return $this->paginateSorted($query, $filters);
    }

    public function aggregateSummary(int $clinicId, array $filters = []): array
    {
        $query = $this->baseQuery($clinicId, $filters, forAggregation: true);

        $rows = $query
            ->selectRaw('type, status, SUM(gross_amount) as total')
            ->groupBy('type', 'status')
            ->get();

        $received        = 0.0;
        $pendingIncome   = 0.0;
        $paid            = 0.0;
        $pendingExpense  = 0.0;

        foreach ($rows as $row) {
            $total = (float) $row->total;
            if ($row->type === FinancialTransactionType::Entrada && $row->status === FinancialTransactionStatus::Recebido) {
                $received += $total;
            } elseif ($row->type === FinancialTransactionType::Entrada && $row->status === FinancialTransactionStatus::Pendente) {
                $pendingIncome += $total;
            } elseif ($row->type === FinancialTransactionType::Saida && $row->status === FinancialTransactionStatus::Pago) {
                $paid += $total;
            } elseif ($row->type === FinancialTransactionType::Saida && $row->status === FinancialTransactionStatus::Pendente) {
                $pendingExpense += $total;
            }
        }

        return [
            'received'         => $received,
            'pending_income'   => $pendingIncome,
            'paid'             => $paid,
            'pending_expense'  => $pendingExpense,
        ];
    }

    private function baseQuery(int $clinicId, array $filters, bool $forAggregation = false): Builder
    {
        $query = $forAggregation
            ? $this->model->newQuery()->forClinic($clinicId)
            : $this->model->newQuery()->forClinic($clinicId);

        $this->applyPeriodFilter($query, $clinicId, $filters);
        $this->applyTypeStatusFilters($query, $filters);
        $this->applyCategoryFilter($query, $filters);
        $this->applyPaymentMethodFilter($query, $filters);

        if (!$forAggregation) {
            $this->applySearchFilter($query, $filters);
        } else {
            $this->applySearchFilter($query, $filters);
        }

        return $query;
    }

    private function applyPeriodFilter(Builder $query, int $clinicId, array $filters): void
    {
        if (empty($filters['period']) && empty($filters['from']) && empty($filters['to'])) {
            $filters['period'] = now()->format('Y-m');
        }

        if (!empty($filters['period'])) {
            $clinic   = Clinic::find($clinicId);
            $timezone = $clinic?->timezone ?? config('app.timezone');
            $start    = Carbon::createFromFormat('Y-m', $filters['period'], $timezone)->startOfMonth();
            $end      = $start->copy()->endOfMonth();
            $query->whereBetween('date', [$start->toDateString(), $end->toDateString()]);

            return;
        }

        if (!empty($filters['from'])) {
            $query->where('date', '>=', $filters['from']);
        }
        if (!empty($filters['to'])) {
            $query->where('date', '<=', $filters['to']);
        }
    }

    private function applyTypeStatusFilters(Builder $query, array $filters): void
    {
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['filter_preset'])) {
            match ($filters['filter_preset']) {
                'entradas'              => $query->where('type', FinancialTransactionType::Entrada->value),
                'entradas_recebidas'    => $query->where('type', FinancialTransactionType::Entrada->value)->where('status', FinancialTransactionStatus::Recebido->value),
                'entradas_pendentes'    => $query->where('type', FinancialTransactionType::Entrada->value)->where('status', FinancialTransactionStatus::Pendente->value),
                'saidas'                => $query->where('type', FinancialTransactionType::Saida->value),
                'saidas_concluidas'     => $query->where('type', FinancialTransactionType::Saida->value)->where('status', FinancialTransactionStatus::Pago->value),
                'saidas_pendentes'      => $query->where('type', FinancialTransactionType::Saida->value)->where('status', FinancialTransactionStatus::Pendente->value),
                default                 => null,
            };
        }
    }

    private function applyCategoryFilter(Builder $query, array $filters): void
    {
        if (!empty($filters['category_id'])) {
            $query->where('financial_category_id', $filters['category_id']);
        }
    }

    private function applyPaymentMethodFilter(Builder $query, array $filters): void
    {
        if (!empty($filters['payment_method'])) {
            $query->where('payment_method', $filters['payment_method']);
        }
    }

    private function applySearchFilter(Builder $query, array $filters): void
    {
        if (empty($filters['q'])) {
            return;
        }

        $term = '%' . $filters['q'] . '%';
        $query->where(function (Builder $q) use ($term) {
            $q->where('description', 'like', $term)
                ->orWhere('type', 'like', $term)
                ->orWhereHas('category', fn (Builder $cat) => $cat->where('name', 'like', $term));
        });
    }

    private function paginateSorted(Builder $query, array $filters): LengthAwarePaginator
    {
        $sort      = $filters['sort'] ?? '-date';
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column    = ltrim($sort, '-');

        $sortMap = [
            'date'         => 'date',
            'description'  => 'description',
            'type'         => 'type',
            'gross_amount' => 'gross_amount',
            'status'       => 'status',
            'category'     => 'financial_category_id',
        ];

        $query->orderBy($sortMap[$column] ?? 'date', $direction);

        $perPage = (int) ($filters['per_page'] ?? 25);
        if (!in_array($perPage, [10, 25, 50], true)) {
            $perPage = 25;
        }

        return $query->paginate($perPage);
    }
}
