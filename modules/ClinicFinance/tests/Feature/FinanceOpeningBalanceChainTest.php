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
use Modules\ClinicFinance\Models\PeriodOpeningBalance;
use Tests\TestCase;

/**
 * Saldo inicial encadeado: sem valor digitado no mês, ele vem do último mês digitado
 * antes dele mais o líquido realizado (recebido − pago) desde então.
 */
class FinanceOpeningBalanceChainTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(now()->setDate(2026, 11, 15)->setTime(12, 0));

        $this->clinic = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->admin  = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
    }

    public function test_without_any_typed_balance_opening_is_all_realized_net_before_the_month(): void
    {
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, '2026-08-10', 300, 10);
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, '2026-10-31', 200);
        $this->transaction($this->clinic, FinancialTransactionType::Saida, FinancialTransactionStatus::Pago, '2026-09-05', 50, 5);
        // No próprio mês: fica no disponível, não no saldo inicial.
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, '2026-11-01', 1000);

        // 290 + 200 − 45 = 445
        $this->summary('2026-11')
            ->assertJsonPath('data.opening_balance', 445)
            ->assertJsonPath('data.opening_balance_source', 'computed')
            ->assertJsonPath('data.available', 1445);
    }

    public function test_month_with_typed_balance_returns_the_typed_value(): void
    {
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, '2026-10-10', 300);
        $this->typed($this->clinic, 2026, 11, 900);

        $this->summary('2026-11')
            ->assertJsonPath('data.opening_balance', 900)
            ->assertJsonPath('data.opening_balance_source', 'typed')
            ->assertJsonPath('data.available', 900);
    }

    public function test_typed_balance_in_september_chains_to_november(): void
    {
        $this->typed($this->clinic, 2026, 7, 5000);
        $this->typed($this->clinic, 2026, 9, 1000);
        // Antes de setembro: já está dentro do digitado, não entra.
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, '2026-08-31', 700);
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, '2026-09-01', 200);
        $this->transaction($this->clinic, FinancialTransactionType::Saida, FinancialTransactionStatus::Pago, '2026-10-31', 50);

        $this->summary('2026-11')
            ->assertJsonPath('data.opening_balance', 1150)
            ->assertJsonPath('data.opening_balance_source', 'computed');

        // Outubro também encadeia de setembro: 1000 + 200.
        $this->summary('2026-10')->assertJsonPath('data.opening_balance', 1200);
    }

    public function test_typed_balance_after_the_month_does_not_count(): void
    {
        $this->typed($this->clinic, 2026, 12, 9999);
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, '2026-10-10', 100);

        $this->summary('2026-11')
            ->assertJsonPath('data.opening_balance', 100)
            ->assertJsonPath('data.opening_balance_source', 'computed');
    }

    public function test_pending_and_trashed_transactions_do_not_enter_the_chain(): void
    {
        $this->typed($this->clinic, 2026, 9, 1000);
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente, '2026-09-10', 400);
        $this->transaction($this->clinic, FinancialTransactionType::Saida, FinancialTransactionStatus::Pendente, '2026-10-10', 300);
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, '2026-10-12', 80)->delete();

        $this->summary('2026-11')
            ->assertJsonPath('data.opening_balance', 1000)
            ->assertJsonPath('data.opening_balance_source', 'computed');
    }

    public function test_another_clinic_balance_and_transactions_do_not_leak(): void
    {
        $other      = Clinic::factory()->create(['timezone' => 'UTC']);
        $otherAdmin = ClinicUser::factory()->create(['clinic_id' => $other->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $this->typed($this->clinic, 2026, 9, 1000);
        $this->typed($this->clinic, 2026, 11, 900);
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, '2026-10-01', 200);
        $this->transaction($other, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, '2026-10-01', 30);

        $this->summary('2026-11', $otherAdmin)
            ->assertJsonPath('data.opening_balance', 30)
            ->assertJsonPath('data.opening_balance_source', 'computed');
        $this->summary('2026-11')
            ->assertJsonPath('data.opening_balance', 900)
            ->assertJsonPath('data.opening_balance_source', 'typed');
        $this->summary('2026-10')->assertJsonPath('data.opening_balance', 1000);
    }

    public function test_admin_deletes_typed_balance_and_month_goes_back_to_computed(): void
    {
        $this->typed($this->clinic, 2026, 9, 1000);
        $this->typed($this->clinic, 2026, 11, 900);
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, '2026-09-01', 200);
        $this->transaction($this->clinic, FinancialTransactionType::Saida, FinancialTransactionStatus::Pago, '2026-10-01', 50);

        $this->actingAs($this->admin, 'clinic')
            ->deleteJson('/api/clinic/finances/opening-balance?period=2026-11')
            ->assertNoContent();

        $this->assertDatabaseMissing('clinic_financial_opening_balances', ['clinic_id' => $this->clinic->id, 'year' => 2026, 'month' => 11]);
        $this->assertDatabaseHas('clinic_financial_opening_balances', ['clinic_id' => $this->clinic->id, 'year' => 2026, 'month' => 9]);
        $this->summary('2026-11')
            ->assertJsonPath('data.opening_balance', 1150)
            ->assertJsonPath('data.opening_balance_source', 'computed');
    }

    public function test_secretary_cannot_delete_typed_balance(): void
    {
        $secretary = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $this->typed($this->clinic, 2026, 11, 900);

        $this->actingAs($secretary, 'clinic')
            ->deleteJson('/api/clinic/finances/opening-balance?period=2026-11')
            ->assertForbidden();

        $this->assertDatabaseHas('clinic_financial_opening_balances', ['clinic_id' => $this->clinic->id, 'month' => 11]);
        // Ela vê o saldo, só não mexe.
        $this->summary('2026-11', $secretary)
            ->assertJsonPath('data.opening_balance', 900)
            ->assertJsonPath('data.opening_balance_source', 'typed');
    }

    public function test_admin_of_another_clinic_cannot_delete_this_clinic_typed_balance(): void
    {
        $otherAdmin = ClinicUser::factory()->create([
            'clinic_id' => Clinic::factory()->create(['timezone' => 'UTC'])->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);
        $this->typed($this->clinic, 2026, 11, 900);

        $this->actingAs($otherAdmin, 'clinic')
            ->deleteJson('/api/clinic/finances/opening-balance?period=2026-11')
            ->assertNoContent();

        $this->assertDatabaseHas('clinic_financial_opening_balances', ['clinic_id' => $this->clinic->id, 'month' => 11, 'amount' => 900]);
    }

    public function test_delete_requires_a_valid_period(): void
    {
        foreach (['', '?period=2026-13', '?period=novembro'] as $query) {
            $this->actingAs($this->admin, 'clinic')
                ->deleteJson('/api/clinic/finances/opening-balance' . $query)
                ->assertUnprocessable()
                ->assertJsonValidationErrors('period');
        }
    }

    private function typed(Clinic $clinic, int $year, int $month, float $amount): PeriodOpeningBalance
    {
        return PeriodOpeningBalance::factory()->create([
            'clinic_id'          => $clinic->id,
            'year'               => $year,
            'month'              => $month,
            'amount'             => $amount,
            'updated_by_user_id' => $this->admin->id,
        ]);
    }

    private function summary(string $period, ?ClinicUser $user = null)
    {
        return $this->actingAs($user ?? $this->admin, 'clinic')
            ->getJson('/api/clinic/finances/summary?period=' . $period)
            ->assertOk();
    }

    private function transaction(Clinic $clinic, FinancialTransactionType $type, FinancialTransactionStatus $status, string $date, float $gross, float $fee = 0): FinancialTransaction
    {
        return FinancialTransaction::factory()->create([
            'clinic_id'             => $clinic->id,
            'financial_category_id' => FinancialCategory::factory()->create(['clinic_id' => $clinic->id, 'type' => $type]),
            'created_by_user_id'    => $this->admin->id,
            'type'                  => $type,
            'status'                => $status,
            'payment_method'        => PaymentMethod::CartaoCredito,
            'date'                  => $date,
            'gross_amount'          => $gross,
            'fee_amount'            => $fee,
            'net_amount'            => FinancialTransaction::computeNetAmount($gross, $fee),
        ]);
    }
}
