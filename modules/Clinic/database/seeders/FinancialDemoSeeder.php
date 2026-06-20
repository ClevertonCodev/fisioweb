<?php

namespace Modules\Clinic\Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Modules\Clinic\Enums\FinancialCategoryOrigin;
use Modules\Clinic\Enums\FinancialTransactionStatus;
use Modules\Clinic\Enums\FinancialTransactionType;
use Modules\Clinic\Enums\PaymentMethod;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicCategoryOverride;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\FinancialCategory;
use Modules\Clinic\Models\FinancialTransaction;
use Modules\Clinic\Models\PeriodOpeningBalance;

/**
 * Popula categorias, saldos de abertura, transações (12 meses), categorias custom,
 * override de categoria seed e lixeira — apenas desenvolvimento.
 */
class FinancialDemoSeeder extends Seeder
{
    private const ENTRADA_DESCRIPTIONS = [
        'Atendimento - João Silva',
        'Atendimento - Maria Santos',
        'Sessão de fisioterapia - Pedro Costa',
        'Avaliação inicial - Ana Lima',
        'Aula experimental - Carlos Mendes',
        'Atendimento domiciliar - Fernanda Rocha',
        'Sessão Pilates - Juliana Alves',
        'Retorno pós-operatório - Roberto Dias',
        'Consultoria corporativa - Empresa FitLife',
        'Pacote mensal - Luiza Ferreira',
        'Atendimento convênio - Paulo Nunes',
        'Sessão RPG - Beatriz Souza',
    ];

    private const SAIDA_DESCRIPTIONS = [
        'Aluguel sala comercial',
        'Salário - Dra. Ana Paula',
        'Salário - recepcionista',
        'Conta de energia elétrica',
        'Conta de água',
        'Internet fibra óptica',
        'Marketing Google Ads',
        'Material de escritório',
        'Manutenção equipamentos',
        'Impostos DAS',
        'Assinatura software gestão',
        'Combustível visitas domiciliares',
    ];

    /** @var list<PaymentMethod> */
    private const PAYMENT_METHODS = [
        PaymentMethod::Pix,
        PaymentMethod::Dinheiro,
        PaymentMethod::CartaoCredito,
        PaymentMethod::CartaoDebito,
        PaymentMethod::Transferencia,
        PaymentMethod::Boleto,
    ];

    public function run(): void
    {
        if (app()->isProduction()) {
            return;
        }

        $this->call(FinancialCategorySeeder::class);

        $clinics = Clinic::query()->orderBy('id')->limit(2)->get();

        foreach ($clinics as $clinic) {
            $this->seedForClinic($clinic);
        }
    }

    private function seedForClinic(Clinic $clinic): void
    {
        $admin = ClinicUser::query()
            ->where('clinic_id', $clinic->id)
            ->where('role', ClinicUser::ROLE_ADMIN)
            ->first();

        if (!$admin) {
            $this->command->warn("Clínica {$clinic->id}: sem admin — pulando finanças demo.");

            return;
        }

        $this->clearClinicFinanceData($clinic->id);

        $customCategories = $this->seedCustomCategories($clinic);
        $this->seedCategoryOverride($clinic);
        $this->seedOpeningBalances($clinic, $admin);

        $categories       = $this->loadCategoriesByType();
        $transactionCount = $this->seedTransactions($clinic, $admin, $categories, $customCategories);
        $trashCount       = $this->seedTrashTransactions($clinic, $admin, $categories);

        $this->command->info(
            "Clínica {$clinic->id} ({$clinic->name}): {$transactionCount} transações + {$trashCount} na lixeira + saldos 12 meses.",
        );
    }

    private function clearClinicFinanceData(int $clinicId): void
    {
        FinancialTransaction::withTrashed()
            ->where('clinic_id', $clinicId)
            ->forceDelete();

        PeriodOpeningBalance::where('clinic_id', $clinicId)->delete();
        ClinicCategoryOverride::where('clinic_id', $clinicId)->delete();

        FinancialCategory::query()
            ->where('clinic_id', $clinicId)
            ->where('origin', FinancialCategoryOrigin::Custom->value)
            ->delete();
    }

    /** @return array<string, FinancialCategory> */
    private function seedCustomCategories(Clinic $clinic): array
    {
        $pilates = FinancialCategory::create([
            'clinic_id'     => $clinic->id,
            'name'          => 'Pilates',
            'type'          => FinancialTransactionType::Entrada->value,
            'origin'        => FinancialCategoryOrigin::Custom->value,
            'active'        => true,
            'display_order' => 100,
        ]);

        $produtos = FinancialCategory::create([
            'clinic_id'     => $clinic->id,
            'name'          => 'Venda de produtos',
            'type'          => FinancialTransactionType::Entrada->value,
            'origin'        => FinancialCategoryOrigin::Custom->value,
            'active'        => true,
            'display_order' => 101,
        ]);

        return [
            'pilates'  => $pilates,
            'produtos' => $produtos,
        ];
    }

    private function seedCategoryOverride(Clinic $clinic): void
    {
        $consultoria = FinancialCategory::query()
            ->whereNull('clinic_id')
            ->where('name', 'Consultoria')
            ->where('type', FinancialTransactionType::Entrada->value)
            ->first();

        if (!$consultoria) {
            return;
        }

        ClinicCategoryOverride::updateOrCreate(
            [
                'clinic_id'              => $clinic->id,
                'financial_category_id'  => $consultoria->id,
            ],
            ['active' => false],
        );
    }

    private function seedOpeningBalances(Clinic $clinic, ClinicUser $admin): void
    {
        $now = Carbon::now();

        for ($offset = 11; $offset >= 0; $offset--) {
            $period = $now->copy()->subMonths($offset);
            $amount = 2500 + ($offset * 180) + random_int(0, 400);

            PeriodOpeningBalance::create([
                'clinic_id'          => $clinic->id,
                'year'               => (int) $period->format('Y'),
                'month'              => (int) $period->format('n'),
                'amount'             => $amount,
                'updated_by_user_id' => $admin->id,
            ]);
        }
    }

    /**
     * @param  array{entrada: list<FinancialCategory>, saida: list<FinancialCategory>}  $categories
     * @param  array<string, FinancialCategory>  $customCategories
     */
    private function seedTransactions(
        Clinic $clinic,
        ClinicUser $admin,
        array $categories,
        array $customCategories,
    ): int {
        $rows    = [];
        $now     = Carbon::now();
        $ts      = now();

        for ($offset = 11; $offset >= 0; $offset--) {
            $monthStart = $now->copy()->subMonths($offset)->startOfMonth();
            $monthEnd   = $monthStart->copy()->endOfMonth();
            $isCurrent  = $offset === 0;

            $entradaCount = $isCurrent ? 55 : random_int(10, 18);
            $saidaCount   = $isCurrent ? 30 : random_int(6, 12);

            for ($i = 0; $i < $entradaCount; $i++) {
                $rows[] = $this->transactionRow(
                    $clinic,
                    $admin,
                    $this->pickEntradaCategory($categories, $customCategories, $i),
                    FinancialTransactionType::Entrada,
                    $this->pickEntradaStatus($i, $isCurrent),
                    $monthStart,
                    $monthEnd,
                    $i,
                    $ts,
                );
            }

            for ($i = 0; $i < $saidaCount; $i++) {
                $rows[] = $this->transactionRow(
                    $clinic,
                    $admin,
                    $categories['saida'][array_rand($categories['saida'])],
                    FinancialTransactionType::Saida,
                    $this->pickSaidaStatus($i, $isCurrent),
                    $monthStart,
                    $monthEnd,
                    $i + 100,
                    $ts,
                );
            }
        }

        foreach (array_chunk($rows, 300) as $chunk) {
            DB::table('clinic_financial_transactions')->insert($chunk);
        }

        return count($rows);
    }

    /**
     * @param  array{entrada: list<FinancialCategory>, saida: list<FinancialCategory>}  $categories
     */
    private function seedTrashTransactions(Clinic $clinic, ClinicUser $admin, array $categories): int
    {
        $now       = Carbon::now();
        $rows      = [];
        $ts        = now();
        $deletedAt = now();

        for ($i = 0; $i < 4; $i++) {
            $type     = $i % 2 === 0 ? FinancialTransactionType::Entrada : FinancialTransactionType::Saida;
            $category = $type === FinancialTransactionType::Entrada
                ? $categories['entrada'][array_rand($categories['entrada'])]
                : $categories['saida'][array_rand($categories['saida'])];
            $status = $type === FinancialTransactionType::Entrada
                ? FinancialTransactionStatus::Recebido
                : FinancialTransactionStatus::Pago;
            $gross  = random_int(80, 350) + random_int(0, 99) / 100;
            $fee    = 0.0;
            $method = self::PAYMENT_METHODS[array_rand(self::PAYMENT_METHODS)];

            $rows[] = [
                'clinic_id'             => $clinic->id,
                'financial_category_id' => $category->id,
                'type'                  => $type->value,
                'status'                => $status->value,
                'payment_method'        => $method->value,
                'date'                  => $now->copy()->subDays($i + 1)->toDateString(),
                'description'           => ($type === FinancialTransactionType::Entrada
                    ? 'Atendimento cancelado - '
                    : 'Despesa estornada - ') . self::ENTRADA_DESCRIPTIONS[$i % count(self::ENTRADA_DESCRIPTIONS)],
                'gross_amount'          => $gross,
                'fee_amount'            => $fee,
                'net_amount'            => FinancialTransaction::computeNetAmount($gross, $fee),
                'notes'                 => 'Excluído para demonstração da lixeira',
                'created_by_user_id'    => $admin->id,
                'deleted_by_user_id'    => $admin->id,
                'created_at'            => $ts,
                'updated_at'            => $ts,
                'deleted_at'            => $deletedAt,
            ];
        }

        DB::table('clinic_financial_transactions')->insert($rows);

        return count($rows);
    }

    /**
     * @return array{entrada: list<FinancialCategory>, saida: list<FinancialCategory>}
     */
    private function loadCategoriesByType(): array
    {
        $all = FinancialCategory::query()
            ->whereNull('clinic_id')
            ->where('active', true)
            ->get();

        return [
            'entrada' => $all->where('type', FinancialTransactionType::Entrada)->values()->all(),
            'saida'   => $all->where('type', FinancialTransactionType::Saida)->values()->all(),
        ];
    }

    /** @param array<string, FinancialCategory> $customCategories */
    private function pickEntradaCategory(array $categories, array $customCategories, int $index): FinancialCategory
    {
        if ($index % 7 === 0) {
            return $customCategories['pilates'];
        }
        if ($index % 11 === 0) {
            return $customCategories['produtos'];
        }

        return $categories['entrada'][array_rand($categories['entrada'])];
    }

    private function pickEntradaStatus(int $index, bool $isCurrent): FinancialTransactionStatus
    {
        if ($isCurrent && $index % 5 === 0) {
            return FinancialTransactionStatus::Pendente;
        }

        return FinancialTransactionStatus::Recebido;
    }

    private function pickSaidaStatus(int $index, bool $isCurrent): FinancialTransactionStatus
    {
        if ($isCurrent && $index % 4 === 0) {
            return FinancialTransactionStatus::Pendente;
        }

        return FinancialTransactionStatus::Pago;
    }

    /** @return array<string, mixed> */
    private function transactionRow(
        Clinic $clinic,
        ClinicUser $admin,
        FinancialCategory $category,
        FinancialTransactionType $type,
        FinancialTransactionStatus $status,
        Carbon $monthStart,
        Carbon $monthEnd,
        int $seed,
        Carbon $ts,
    ): array {
        $method = self::PAYMENT_METHODS[$seed % count(self::PAYMENT_METHODS)];
        $gross  = $type === FinancialTransactionType::Entrada
            ? random_int(80, 450) + random_int(0, 99) / 100
            : random_int(50, 2800) + random_int(0, 99) / 100;

        $fee = in_array($method, [PaymentMethod::CartaoCredito, PaymentMethod::CartaoDebito], true)
            ? round($gross * 0.025, 2)
            : 0.0;

        $descriptions = $type === FinancialTransactionType::Entrada
            ? self::ENTRADA_DESCRIPTIONS
            : self::SAIDA_DESCRIPTIONS;

        $dayOffset = ($seed * 3) % max(1, $monthStart->daysInMonth - 1);
        $date      = $monthStart->copy()->addDays($dayOffset)->min($monthEnd);

        return [
            'clinic_id'             => $clinic->id,
            'financial_category_id' => $category->id,
            'type'                  => $type->value,
            'status'                => $status->value,
            'payment_method'        => $method->value,
            'date'                  => $date->toDateString(),
            'description'           => $descriptions[$seed % count($descriptions)],
            'gross_amount'          => $gross,
            'fee_amount'            => $fee,
            'net_amount'            => FinancialTransaction::computeNetAmount($gross, $fee),
            'notes'                 => $seed % 9 === 0 ? 'Observação de demonstração' : null,
            'created_by_user_id'    => $admin->id,
            'deleted_by_user_id'    => null,
            'created_at'            => $ts,
            'updated_at'            => $ts,
            'deleted_at'            => null,
        ];
    }
}
