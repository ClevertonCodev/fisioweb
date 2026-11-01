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

    public function findLocked(int $id): ?FinancialTransaction
    {
        // O escopo de SoftDeletes deixa de fora o que está na lixeira, também depois de esperar a trava.
        return $this->model->newQuery()->lockForUpdate()->find($id);
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

        return $transaction->refresh()->load(['category', 'createdBy:id,name', 'deletedBy:id,name']);
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

        return $transaction->refresh()->load(['category', 'createdBy:id,name']);
    }

    public function paginateForClinic(int $clinicId, array $filters = []): LengthAwarePaginator
    {
        $query = $this->baseQuery($clinicId, $filters)
            // Quem lançou e quem excluiu vão só com `id` e `name`: o usuário inteiro levaria
            // e-mail, CPF, papel e os dados do Google para a secretária.
            ->with(['category', 'createdBy:id,name', 'financialSeries'])
            ->withCount('attachments');

        return $this->paginateSorted($query, $filters);
    }

    public function sumNetForClinic(int $clinicId, array $filters = []): float
    {
        return (float) $this->baseQuery($clinicId, $filters, forAggregation: true)->sum('net_amount');
    }

    public function paginateTrashedForClinic(int $clinicId, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->onlyTrashed()
            ->forClinic($clinicId)
            ->with(['category', 'deletedBy:id,name', 'financialSeries']);

        // A lixeira das Configurações não tem mês: sem período pedido, vem todo o histórico,
        // o último excluído primeiro (sem isto, o padrão seria só o mês atual).
        if (!empty($filters['period']) || !empty($filters['from']) || !empty($filters['to'])) {
            $this->applyPeriodFilter($query, $clinicId, $filters);
        }
        $this->applySearchFilter($query, $filters);

        return $this->paginateSorted($query, ['sort' => '-deleted_at', ...$filters]);
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
            ->selectRaw('type, status, SUM(net_amount) as total')
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

    public function realizedNetBetween(int $clinicId, ?string $from, string $before): float
    {
        $total = $this->model->newQuery()
            ->forClinic($clinicId)
            ->when(!is_null($from), fn (Builder $q) => $q->where('date', '>=', $from))
            ->where('date', '<', $before)
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN type = ? AND status = ? THEN net_amount WHEN type = ? AND status = ? THEN -net_amount ELSE 0 END), 0) as total',
                [
                    FinancialTransactionType::Entrada->value,
                    FinancialTransactionStatus::Recebido->value,
                    FinancialTransactionType::Saida->value,
                    FinancialTransactionStatus::Pago->value,
                ],
            )
            ->value('total');

        return (float) $total;
    }

    public function incomeVsExpenseRows(int $clinicId, array $filters = []): Collection
    {
        $range = $this->resolveDateRange($clinicId, $filters);

        return $this->model->newQuery()
            ->forClinic($clinicId)
            ->whereBetween('date', [$range['from'], $range['to']])
            ->selectRaw('date, type, SUM(net_amount) as total')
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
            ->selectRaw('c.id as category_id, c.name, clinic_financial_transactions.type, SUM(net_amount) as total')
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
            ->selectRaw("{$yearExpr} as year, {$monthExpr} as month, type, SUM(net_amount) as total")
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
            ->selectRaw('c.id as category_id, c.name, clinic_financial_transactions.type, COUNT(*) as count, SUM(net_amount) as total')
            ->groupBy('c.id', 'c.name', 'clinic_financial_transactions.type');

        if (!empty($filters['type'])) {
            $query->where('clinic_financial_transactions.type', $filters['type']);
        }

        return $query->orderByDesc('total')->get();
    }

    public function dailyNetTotalsRows(int $clinicId, string $from, string $to): Collection
    {
        return $this->model->newQuery()
            ->forClinic($clinicId)
            // Semiaberto: no SQLite a data fica gravada com hora, e o BETWEEN cortaria o último dia.
            ->where('date', '>=', $from)
            ->where('date', '<', Carbon::parse($to)->addDay()->toDateString())
            ->selectRaw('date, type, SUM(net_amount) as total')
            ->groupBy('date', 'type')
            ->orderBy('date')
            ->get();
    }

    private function baseQuery(int $clinicId, array $filters, bool $forAggregation = false): Builder
    {
        $query = $forAggregation
            ? $this->model->newQuery()->forClinic($clinicId)
            : $this->model->newQuery()->forClinic($clinicId);

        if (!empty($filters['overdue_until'])) {
            $this->applyOverdueFilter($query, $filters['overdue_until']);
        } else {
            // A listagem com busca vai em todo o histórico; as somas continuam no mês.
            $this->applyPeriodFilter($query, $clinicId, $filters, searchSpansHistory: !$forAggregation);
        }
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

    /**
     * "A receber" e "a pagar": só pendências, com data até `$until` (o fim do mês na tela),
     * sem início, para as atrasadas de meses anteriores não sumirem.
     */
    private function applyOverdueFilter(Builder $query, string $until): void
    {
        $query->where('status', FinancialTransactionStatus::Pendente->value)
            // whereDate: no SQLite a data fica gravada com hora, e o último dia ficaria de fora.
            ->whereDate('date', '<=', $until);
    }

    private function applyPeriodFilter(Builder $query, int $clinicId, array $filters, bool $searchSpansHistory = false): void
    {
        if (empty($filters['period']) && empty($filters['from']) && empty($filters['to'])) {
            if ($searchSpansHistory && !empty($filters['q'])) {
                return;
            }
            $filters['period'] = now()->format('Y-m');
        }

        if (!empty($filters['period'])) {
            $timezone = DB::table('clinics')->where('id', $clinicId)->value('timezone') ?? config('app.timezone');
            // "!" zera o dia: sem ele, no dia 31 "2026-09" vira 31/09 → 01/10.
            $start    = Carbon::createFromFormat('!Y-m', $filters['period'], $timezone)->startOfMonth();
            $end      = $start->copy()->endOfMonth();
            $query->whereBetween('date', [$start->toDateString(), $end->toDateString()]);

            return;
        }

        if (!empty($filters['from'])) {
            $query->where('date', '>=', $filters['from']);
        }
        if (!empty($filters['to'])) {
            // whereDate: no SQLite a data fica gravada com hora, e `from = to = dia` voltaria vazio.
            $query->whereDate('date', '<=', $filters['to']);
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

        // LOWER dos dois lados: no Postgres o LIKE diferencia maiúscula, e "aluguel" precisa
        // achar "Aluguel". O termo vai em mb_strtolower porque o LOWER do sqlite só baixa ASCII.
        // "%" e "_" digitados são texto: escapados com "!" (o ESCAPE '!' vale igual no Postgres,
        // no SQLite e no MySQL, e com ele a barra invertida deixa de ser especial no Postgres).
        $term     = '%' . str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($filters['q'])) . '%';
        $contains = fn (Builder $q, string $column) => $q->whereRaw("LOWER({$column}) LIKE ? ESCAPE '!'", [$term]);
        // Nome do paciente: os ids vêm do contrato de Patient (o Service preenche `q_patient_ids`).
        $patientIds = array_values(array_filter(array_map('intval', (array) ($filters['q_patient_ids'] ?? []))));
        $query->where(function (Builder $q) use ($contains, $patientIds) {
            $contains($q, 'description');
            $q->orWhereHas('category', fn (Builder $cat) => $contains($cat, 'name'));
            if (!empty($patientIds)) {
                $q->orWhereIn('patient_id', $patientIds);
            }
        });
    }

    private function paginateSorted(Builder $query, array $filters): LengthAwarePaginator
    {
        // Pendências: da mais antiga (a mais atrasada) para a mais nova.
        $sort      = $filters['sort'] ?? (empty($filters['overdue_until']) ? '-date' : 'date');
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column    = ltrim($sort, '-');

        $sortMap = [
            'date'         => 'date',
            'description'  => 'description',
            'type'         => 'type',
            'gross_amount' => 'gross_amount',
            'status'       => 'status',
            'category'     => 'financial_category_id',
            'deleted_at'   => 'deleted_at',
        ];

        // Desempate pelo id: sem ele, os empates (todos do mesmo dia) mudam de ordem entre as páginas no Postgres.
        $query->orderBy($sortMap[$column] ?? 'date', $direction)
            ->orderBy($this->model->getQualifiedKeyName(), $direction);

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
        $start  = Carbon::createFromFormat('!Y-m', $period, $tz)->startOfMonth();

        return [
            'from' => $start->toDateString(),
            'to'   => $start->copy()->endOfMonth()->toDateString(),
        ];
    }
}
