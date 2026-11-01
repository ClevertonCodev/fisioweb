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

class FinanceSummaryNetAmountTest extends TestCase
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

    public function test_summary_counts_received_income_net_of_fee(): void
    {
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, 100, 3);

        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/finances/summary?period=' . now()->format('Y-m'))
            ->assertOk()
            ->assertJsonPath('data.income.received', 97)
            ->assertJsonPath('data.available', 97);
    }

    public function test_forecast_adds_pending_amounts_net_of_fee(): void
    {
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, 100, 3);
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente, 200, 10);
        $this->transaction($this->clinic, FinancialTransactionType::Saida, FinancialTransactionStatus::Pago, 50, 5);
        $this->transaction($this->clinic, FinancialTransactionType::Saida, FinancialTransactionStatus::Pendente, 80, 2);

        // disponível = 97 − 45 = 52; previsão = 52 + 190 − 78 = 164
        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/finances/summary?period=' . now()->format('Y-m'))
            ->assertOk()
            ->assertJsonPath('data.income.pending', 190)
            ->assertJsonPath('data.expense.paid', 45)
            ->assertJsonPath('data.expense.pending', 78)
            ->assertJsonPath('data.available', 52)
            ->assertJsonPath('data.forecast', 164);
    }

    public function test_summary_of_another_clinic_ignores_this_clinic_transactions(): void
    {
        $other      = Clinic::factory()->create(['timezone' => 'UTC']);
        $otherAdmin = ClinicUser::factory()->create(['clinic_id' => $other->id]);
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, 100, 3);
        $this->transaction($other, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, 10, 1);

        $this->actingAs($otherAdmin, 'clinic')
            ->getJson('/api/clinic/finances/summary?period=' . now()->format('Y-m'))
            ->assertOk()
            ->assertJsonPath('data.income.received', 9)
            ->assertJsonPath('data.available', 9);
    }

    private function transaction(Clinic $clinic, FinancialTransactionType $type, FinancialTransactionStatus $status, float $gross, float $fee): FinancialTransaction
    {
        return FinancialTransaction::factory()->create([
            'clinic_id'             => $clinic->id,
            'financial_category_id' => FinancialCategory::factory()->create(['clinic_id' => $clinic->id, 'type' => $type]),
            'created_by_user_id'    => $this->admin->id,
            'type'                  => $type,
            'status'                => $status,
            'payment_method'        => PaymentMethod::CartaoCredito,
            'date'                  => now(),
            'gross_amount'          => $gross,
            'fee_amount'            => $fee,
            'net_amount'            => FinancialTransaction::computeNetAmount($gross, $fee),
        ]);
    }
}
