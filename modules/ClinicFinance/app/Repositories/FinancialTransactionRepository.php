<?php

namespace Modules\ClinicFinance\Repositories;

use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\ClinicFinance\Contracts\FinancialTransactionRepositoryInterface;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Models\FinancialTransaction;

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

    public function listForExport(int $clinicId, array $range): Collection
    {
        return $this->model->newQuery()
            ->forClinic($clinicId)
            ->with('category')
            ->whereBetween('date', [$range['from'], $range['to']])
            ->orderBy('date')
            ->get();
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

    public function incomeVsExpenseRows(int $clinicId, array $filters = []): Collection
    {
        $range = $this->resolveDateRange($clinicId, $filters);

        return $this->model->newQuery()
            ->forClinic($clinicId)
            ->whereBetween('date', [$range['from'], $range['to']])
            ->selectRaw('date, type, SUM(gross_amount) as total')
            ->groupBy('date', 'type')
            ->orderBy('date')
            ->get();
    }

    public function categoryDistributionRows(int $clinicId, array $filters = [], int $limit = 5): Collection
    {
        $range = $this->resolveDateRange($clinicId, $filters);

        $query = $this->model->newQuery()
            ->forClinic($clinicId)
            ->whereBetween('date', [$range['from'], $range['to']])
            ->join('clinic_financial_categories as c', 'c.id', '=', 'clinic_financial_transactions.financial_category_id')
            ->selectRaw('c.id as category_id, c.name, clinic_financial_transactions.type, SUM(gross_amount) as total')
            ->groupBy('c.id', 'c.name', 'clinic_financial_transactions.type');

        if (!empty($filters['type'])) {
            $query->where('clinic_financial_transactions.type', $filters['type']);
        }

        return $query->orderByDesc('total')->limit($limit)->get();
    }

    public function monthlyComparisonRows(int $clinicId, int $months = 12): array
    {
        $timezone = DB::table('clinics')->where('id', $clinicId)->value('timezone') ?? config('app.timezone');
        $end      = Carbon::now($timezone)->startOfMonth();
        $start    = $end->copy()->subMonths($months - 1);

        [$yearExpr, $monthExpr] = $this->monthPartsSql();

        $rows = $this->model->newQuery()
            ->forClinic($clinicId)
            ->whereBetween('date', [$start->toDateString(), $end->copy()->endOfMonth()->toDateString()])
            ->selectRaw("{$yearExpr} as year, {$monthExpr} as month, type, SUM(gross_amount) as total")
            ->groupBy(DB::raw($yearExpr), DB::raw($monthExpr), 'type')
            ->get();

        return [
            'start' => $start,
            'end'   => $end,
            'rows'  => $rows,
        ];
    }

    public function categoryBreakdownRows(int $clinicId, array $filters = []): Collection
    {
        $range = $this->resolveDateRange($clinicId, $filters);

        $query = $this->model->newQuery()
            ->forClinic($clinicId)
            ->whereBetween('date', [$range['from'], $range['to']])
            ->join('clinic_financial_categories as c', 'c.id', '=', 'clinic_financial_transactions.financial_category_id')
            ->selectRaw('c.id as category_id, c.name, clinic_financial_transactions.type, COUNT(*) as count, SUM(gross_amount) as total')
            ->groupBy('c.id', 'c.name', 'clinic_financial_transactions.type');

        if (!empty($filters['type'])) {
            $query->where('clinic_financial_transactions.type', $filters['type']);
        }

        return $query->orderByDesc('total')->get();
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
            $timezone = DB::table('clinics')->where('id', $clinicId)->value('timezone') ?? config('app.timezone');
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

    /**
     * @return array{0: string, 1: string}
     */
    private function monthPartsSql(): array
    {
        return match (DB::connection()->getDriverName()) {
            'pgsql'  => ['EXTRACT(YEAR FROM date)::int', 'EXTRACT(MONTH FROM date)::int'],
            'sqlite' => ["CAST(strftime('%Y', date) AS INTEGER)", "CAST(strftime('%m', date) AS INTEGER)"],
            default  => ['YEAR(date)', 'MONTH(date)'],
        };
    }

    /**
     * @return array{from: string, to: string}
     */
    private function resolveDateRange(int $clinicId, array $filters): array
    {
        if (!empty($filters['from']) && !empty($filters['to'])
            && preg_match('/^\d{4}-\d{2}-\d{2}$/', $filters['from'])
            && preg_match('/^\d{4}-\d{2}-\d{2}$/', $filters['to'])) {
            return ['from' => $filters['from'], 'to' => $filters['to']];
        }

        $period = $filters['period'] ?? now()->format('Y-m');
        $tz     = DB::table('clinics')->where('id', $clinicId)->value('timezone') ?? config('app.timezone');
        $start  = Carbon::createFromFormat('Y-m', $period, $tz)->startOfMonth();

        return [
            'from' => $start->toDateString(),
            'to'   => $start->copy()->endOfMonth()->toDateString(),
        ];
    }
}
