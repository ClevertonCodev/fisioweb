<?php

namespace Modules\ClinicFinance\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Enums\PaymentMethod;
use Modules\ClinicFinance\Models\FinancialCategory;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Tests\TestCase;

class FinanceReportsNetAmountTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(now()->startOfMonth()->addDays(14)->setTime(12, 0));

        $this->clinic = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->admin  = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id]);
    }

    public function test_income_vs_expense_sums_net_amount(): void
    {
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, 100, 3);
        $this->transaction($this->clinic, FinancialTransactionType::Saida, 40, 2);

        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/finances/reports/income-vs-expense?period=' . now()->format('Y-m'))
            ->assertOk()
            ->assertJsonPath('data.0.date', now()->toDateString())
            ->assertJsonPath('data.0.income', 97)
            ->assertJsonPath('data.0.expense', 38);
    }

    public function test_category_distribution_sums_net_amount(): void
    {
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, 100, 3);

        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/finances/reports/category-distribution?period=' . now()->format('Y-m'))
            ->assertOk()
            ->assertJsonPath('data.0.total', 97);
    }

    public function test_monthly_comparison_sums_net_amount(): void
    {
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, 100, 3);
        $this->transaction($this->clinic, FinancialTransactionType::Saida, 40, 2);

        // O mês atual é o último dos 12.
        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/finances/reports/monthly-comparison?months=12')
            ->assertOk()
            ->assertJsonCount(12, 'data')
            ->assertJsonPath('data.11.month', (int) now()->format('n'))
            ->assertJsonPath('data.11.income', 97)
            ->assertJsonPath('data.11.expense', 38);
    }

    public function test_category_breakdown_sums_net_amount(): void
    {
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, 100, 3);

        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/finances/reports/category-breakdown?period=' . now()->format('Y-m'))
            ->assertOk()
            ->assertJsonPath('data.0.count', 1)
            ->assertJsonPath('data.0.total', 97);
    }

    public function test_report_summary_sums_net_amount(): void
    {
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, 100, 3);
        $this->transaction($this->clinic, FinancialTransactionType::Saida, 40, 2);

        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/finances/reports/summary?period=' . now()->format('Y-m'))
            ->assertOk()
            ->assertJsonPath('data.totals.income', 97)
            ->assertJsonPath('data.totals.expense', 38)
            ->assertJsonPath('data.totals.balance', 59);
    }

    public function test_category_breakdown_percentage_is_within_each_type(): void
    {
        // Entradas líquidas: 60 + 40 = 100 → 60% e 40%; a saída sozinha é 100% das saídas.
        $consulta = $this->category($this->clinic, FinancialTransactionType::Entrada, 'Consulta');
        $pacote   = $this->category($this->clinic, FinancialTransactionType::Entrada, 'Pacote');
        $aluguel  = $this->category($this->clinic, FinancialTransactionType::Saida, 'Aluguel');
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, 63, 3, $consulta);
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, 40, 0, $pacote);
        $this->transaction($this->clinic, FinancialTransactionType::Saida, 500, 0, $aluguel);

        $rows = collect($this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/finances/reports/category-breakdown?period=' . now()->format('Y-m'))
            ->assertOk()
            ->json('data'))
            ->keyBy('name');

        $this->assertEquals(60, $rows['Consulta']['percentage']);
        $this->assertEquals(40, $rows['Pacote']['percentage']);
        $this->assertEquals(100, $rows['Aluguel']['percentage']);
    }

    public function test_reports_of_a_30_day_month_asked_on_the_31st_do_not_return_the_next_month(): void
    {
        // Lançamento no dia 15 e consulta no dia 31: "2026-09" não pode virar 31/09 → 01/10.
        $this->travelTo(now()->setDate(2026, 10, 15)->setTime(12, 0));
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, 100, 3);
        $this->travelTo(now()->setDate(2026, 10, 31)->setTime(12, 0));

        $client = $this->actingAs($this->admin, 'clinic');

        $client->getJson('/api/clinic/finances/reports/summary?period=2026-09')
            ->assertOk()
            ->assertJsonPath('data.totals.income', 0);
        $client->getJson('/api/clinic/finances/reports/category-breakdown?period=2026-09')
            ->assertOk()
            ->assertJsonCount(0, 'data');
        $client->getJson('/api/clinic/finances/reports/income-vs-expense?period=2026-09')
            ->assertOk()
            ->assertJsonCount(0, 'data');
        // Sem nada em setembro, outubro não tem com o que comparar.
        $client->getJson('/api/clinic/finances/reports/summary?period=2026-10')
            ->assertOk()
            ->assertJsonPath('data.totals.income', 97)
            ->assertJsonPath('data.variation.income', null);
    }

    public function test_another_clinic_transactions_enter_no_report(): void
    {
        $other = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, 100, 3);
        $this->transaction($this->clinic, FinancialTransactionType::Saida, 40, 2);
        $this->transaction($other, FinancialTransactionType::Entrada, 900, 0);
        $this->transaction($other, FinancialTransactionType::Saida, 700, 0);

        $period = now()->format('Y-m');
        $client = $this->actingAs($this->admin, 'clinic');

        $client->getJson("/api/clinic/finances/reports/summary?period={$period}")
            ->assertOk()
            ->assertJsonPath('data.totals.income', 97)
            ->assertJsonPath('data.totals.expense', 38);

        $client->getJson("/api/clinic/finances/reports/income-vs-expense?period={$period}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.income', 97)
            ->assertJsonPath('data.0.expense', 38);

        $client->getJson('/api/clinic/finances/reports/monthly-comparison?months=12')
            ->assertOk()
            ->assertJsonPath('data.11.income', 97)
            ->assertJsonPath('data.11.expense', 38);

        $client->getJson("/api/clinic/finances/reports/category-distribution?period={$period}")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.total', 97);

        $client->getJson("/api/clinic/finances/reports/category-breakdown?period={$period}")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.total', 97)
            ->assertJsonPath('data.0.percentage', 100)
            ->assertJsonPath('data.1.percentage', 100);
    }

    public function test_user_of_another_clinic_sees_only_own_reports(): void
    {
        $other      = Clinic::factory()->create(['timezone' => 'UTC']);
        $otherAdmin = ClinicUser::factory()->create(['clinic_id' => $other->id]);
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, 100, 3);

        $this->actingAs($otherAdmin, 'clinic')
            ->getJson('/api/clinic/finances/reports/category-breakdown?period=' . now()->format('Y-m'))
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->actingAs($otherAdmin, 'clinic')
            ->getJson('/api/clinic/finances/reports/summary?period=' . now()->format('Y-m'))
            ->assertOk()
            ->assertJsonPath('data.totals.income', 0);
    }

    private function category(Clinic $clinic, FinancialTransactionType $type, string $name = 'Categoria'): FinancialCategory
    {
        return FinancialCategory::factory()->create(['clinic_id' => $clinic->id, 'type' => $type, 'name' => $name]);
    }

    private function transaction(
        Clinic $clinic,
        FinancialTransactionType $type,
        float $gross,
        float $fee,
        ?FinancialCategory $category = null,
    ): FinancialTransaction {
        return FinancialTransaction::factory()->create([
            'clinic_id'             => $clinic->id,
            'financial_category_id' => ($category ?? $this->category($clinic, $type))->id,
            'created_by_user_id'    => $this->admin->id,
            'type'                  => $type,
            'status'                => $type === FinancialTransactionType::Entrada
                ? FinancialTransactionStatus::Recebido
                : FinancialTransactionStatus::Pago,
            'payment_method'        => PaymentMethod::CartaoCredito,
            'date'                  => now(),
            'gross_amount'          => $gross,
            'fee_amount'            => $fee,
            'net_amount'            => FinancialTransaction::computeNetAmount($gross, $fee),
        ]);
    }
}
