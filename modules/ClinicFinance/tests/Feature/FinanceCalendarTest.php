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

/** GET /clinic/finances/calendar: entrou e saiu (líquido) por dia do mês, somado no servidor. */
class FinanceCalendarTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(now()->setDate(2026, 10, 15)->setTime(12, 0));

        $this->clinic = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->admin  = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id]);
    }

    public function test_day_totals_of_a_month_with_150_transactions_match_the_database_sum(): void
    {
        $expected = [];
        for ($i = 0; $i < 150; $i++) {
            $day    = sprintf('2026-10-%02d', ($i % 28) + 1);
            $type   = $i % 3 === 0 ? FinancialTransactionType::Saida : FinancialTransactionType::Entrada;
            $status = $type === FinancialTransactionType::Saida ? FinancialTransactionStatus::Pago : FinancialTransactionStatus::Recebido;
            $gross  = 10 + ($i * 1.37);
            $tx     = $this->transaction($this->clinic, $type, $status, $gross, 0, $day);

            $key                 = $type === FinancialTransactionType::Entrada ? 'income' : 'expense';
            $expected[$day] ??= ['income' => 0.0, 'expense' => 0.0];
            $expected[$day][$key] += (float) $tx->net_amount;
        }

        $days = $this->calendar('2026-10');

        $this->assertCount(28, $days);
        foreach ($days as $day) {
            $this->assertEqualsWithDelta($expected[$day['date']]['income'], $day['income'], 0.001, "entrada de {$day['date']}");
            $this->assertEqualsWithDelta($expected[$day['date']]['expense'], $day['expense'], 0.001, "saída de {$day['date']}");
        }
    }

    public function test_day_totals_are_net_of_fee_split_by_type_and_include_pending(): void
    {
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, 100, 3, '2026-10-05');
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente, 200, 10, '2026-10-05');
        $this->transaction($this->clinic, FinancialTransactionType::Saida, FinancialTransactionStatus::Pago, 50, 5, '2026-10-05');
        $this->transaction($this->clinic, FinancialTransactionType::Saida, FinancialTransactionStatus::Pendente, 80, 2, '2026-10-20');

        $this->assertSame([
            ['date' => '2026-10-05', 'income' => 287, 'expense' => 45],
            ['date' => '2026-10-20', 'income' => 0, 'expense' => 78],
        ], $this->calendar('2026-10'));
    }

    public function test_another_clinic_transactions_never_enter_the_sum(): void
    {
        $other      = Clinic::factory()->create(['timezone' => 'UTC']);
        $otherAdmin = ClinicUser::factory()->create(['clinic_id' => $other->id]);
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, 100, 0, '2026-10-05');
        $this->transaction($other, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, 7, 0, '2026-10-05');
        $this->transaction($other, FinancialTransactionType::Saida, FinancialTransactionStatus::Pago, 9, 0, '2026-10-06');

        $this->assertSame([['date' => '2026-10-05', 'income' => 100, 'expense' => 0]], $this->calendar('2026-10'));
        $this->assertSame([
            ['date' => '2026-10-05', 'income' => 7, 'expense' => 0],
            ['date' => '2026-10-06', 'income' => 0, 'expense' => 9],
        ], $this->calendar('2026-10', $otherAdmin));
    }

    public function test_secretary_reads_the_calendar_and_physiotherapist_is_forbidden(): void
    {
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, 100, 0, '2026-10-05');
        $secretary       = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $physiotherapist = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);

        $this->assertSame([['date' => '2026-10-05', 'income' => 100, 'expense' => 0]], $this->calendar('2026-10', $secretary));
        $this->actingAs($physiotherapist, 'clinic')
            ->getJson('/api/clinic/finances/calendar?period=2026-10')
            ->assertForbidden();
    }

    public function test_only_the_requested_month_counts_and_trashed_transactions_are_left_out(): void
    {
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, 100, 0, '2026-10-31');
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, 40, 0, '2026-09-30');
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, 30, 0, '2026-11-01');
        $this->transaction($this->clinic, FinancialTransactionType::Saida, FinancialTransactionStatus::Pago, 20, 0, '2026-10-31')->delete();

        $this->assertSame([['date' => '2026-10-31', 'income' => 100, 'expense' => 0]], $this->calendar('2026-10'));
    }

    public function test_day_list_brings_only_that_day_paginated(): void
    {
        for ($i = 0; $i < 12; $i++) {
            $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, 10 + $i, 0, '2026-10-05');
        }
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, 99, 0, '2026-10-04');
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, 98, 0, '2026-10-06');

        $url    = '/api/clinic/finances/transactions?from=2026-10-05&to=2026-10-05&per_page=10';
        $first  = $this->actingAs($this->admin, 'clinic')->getJson($url)->assertOk();
        $second = $this->actingAs($this->admin, 'clinic')->getJson("{$url}&page=2")->assertOk();

        $first->assertJsonPath('meta.total', 12)->assertJsonCount(10, 'data');
        $second->assertJsonPath('meta.page', 2)->assertJsonCount(2, 'data');
        $dates = collect([...$first->json('data'), ...$second->json('data')])
            ->map(fn (array $tx) => substr($tx['date'], 0, 10))
            ->unique()
            ->values()
            ->all();
        $this->assertSame(['2026-10-05'], $dates);

        // Num dia só, todos empatam na data: o desempate pelo id (mais novo primeiro) evita repetir ou pular na página seguinte.
        $ids = collect([...$first->json('data'), ...$second->json('data')])->pluck('id')->all();
        $this->assertSame(collect($ids)->sortDesc()->values()->all(), $ids);
        $this->assertCount(12, array_unique($ids));
    }

    public function test_period_must_be_a_year_and_month(): void
    {
        foreach (['', '2026-13', '2026-10-01', 'abc'] as $period) {
            $this->actingAs($this->admin, 'clinic')
                ->getJson("/api/clinic/finances/calendar?period={$period}")
                ->assertUnprocessable()
                ->assertJsonValidationErrors('period');
        }
    }

    /**
     * @return array<int, array{date: string, income: float, expense: float}>
     */
    private function calendar(string $period, ?ClinicUser $user = null): array
    {
        return $this->actingAs($user ?? $this->admin, 'clinic')
            ->getJson("/api/clinic/finances/calendar?period={$period}")
            ->assertOk()
            ->assertJsonPath('data.period', $period)
            ->json('data.days');
    }

    /** @var array<string, FinancialCategory> */
    private array $categories = [];

    private function category(Clinic $clinic, FinancialTransactionType $type): FinancialCategory
    {
        return $this->categories["{$clinic->id}-{$type->value}"] ??= FinancialCategory::factory()->create([
            'clinic_id' => $clinic->id,
            'type'      => $type,
            'name'      => "Categoria {$type->value}",
        ]);
    }

    private function transaction(Clinic $clinic, FinancialTransactionType $type, FinancialTransactionStatus $status, float $gross, float $fee, string $date): FinancialTransaction
    {
        return FinancialTransaction::factory()->create([
            'clinic_id'             => $clinic->id,
            'financial_category_id' => $this->category($clinic, $type)->id,
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
