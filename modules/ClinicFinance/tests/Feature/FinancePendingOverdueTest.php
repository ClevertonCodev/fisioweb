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

/**
 * GET /clinic/finances/transactions?overdue_until=YYYY-MM-DD: as pendências até o fim do mês na tela,
 * incluindo as atrasadas de meses anteriores, com o total líquido somado no servidor.
 */
class FinancePendingOverdueTest extends TestCase
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

    public function test_pending_until_end_of_month_includes_overdue_from_previous_months_oldest_first(): void
    {
        $october   = $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente, 50, 0, '2026-10-31');
        $september = $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente, 100, 0, '2026-09-10');
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente, 70, 0, '2026-12-01');
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente, 30, 0, '2026-11-01');

        $response = $this->pending('entrada', '2026-10-31');

        $this->assertSame([$september->id, $october->id], array_column($response->json('data'), 'id'));
    }

    public function test_received_paid_and_trashed_never_appear_even_without_the_status_param(): void
    {
        $pending = $this->transaction($this->clinic, FinancialTransactionType::Saida, FinancialTransactionStatus::Pendente, 80, 0, '2026-09-20');
        $this->transaction($this->clinic, FinancialTransactionType::Saida, FinancialTransactionStatus::Pago, 90, 0, '2026-09-20');
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, 60, 0, '2026-10-01');
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente, 40, 0, '2026-10-02');
        $this->transaction($this->clinic, FinancialTransactionType::Saida, FinancialTransactionStatus::Pendente, 20, 0, '2026-10-03')->delete();

        $toPay = $this->pending('saida', '2026-10-31');
        $this->assertSame([$pending->id], array_column($toPay->json('data'), 'id'));

        $any = $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/finances/transactions?overdue_until=2026-10-31')
            ->assertOk();
        $statuses = array_unique(array_column($any->json('data'), 'status'));
        $this->assertSame(['pendente'], array_values($statuses));
        $this->assertSame(2, $any->json('meta.total'));
    }

    public function test_net_total_is_the_sum_of_every_pending_of_the_filter_not_only_the_loaded_page(): void
    {
        $expected = 0.0;
        for ($i = 0; $i < 30; $i++) {
            $date      = $i % 2 === 0 ? '2026-09-05' : '2026-10-25';
            $tx        = $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente, 10 + $i * 1.11, 0.5, $date);
            $expected += (float) $tx->net_amount;
        }
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Recebido, 500, 0, '2026-10-01');
        $this->transaction($this->clinic, FinancialTransactionType::Saida, FinancialTransactionStatus::Pendente, 700, 0, '2026-10-01');
        $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente, 900, 0, '2026-11-02');

        $first  = $this->pending('entrada', '2026-10-31', extra: '&per_page=25');
        $second = $this->pending('entrada', '2026-10-31', extra: '&per_page=25&page=2');

        $first->assertJsonCount(25, 'data')->assertJsonPath('meta.total', 30);
        $second->assertJsonCount(5, 'data');
        $this->assertEqualsWithDelta($expected, $first->json('meta.netTotal'), 0.001);
        $this->assertEqualsWithDelta($expected, $second->json('meta.netTotal'), 0.001);
    }

    public function test_another_clinic_pending_never_appears_nor_enters_the_total(): void
    {
        $other      = Clinic::factory()->create(['timezone' => 'UTC']);
        $otherAdmin = ClinicUser::factory()->create(['clinic_id' => $other->id]);
        $mine       = $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente, 100, 0, '2026-09-10');
        $theirs     = $this->transaction($other, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente, 7, 0, '2026-09-10');

        $response = $this->pending('entrada', '2026-10-31');
        $this->assertSame([$mine->id], array_column($response->json('data'), 'id'));
        $this->assertEqualsWithDelta(100, $response->json('meta.netTotal'), 0.001);

        $otherResponse = $this->pending('entrada', '2026-10-31', $otherAdmin);
        $this->assertSame([$theirs->id], array_column($otherResponse->json('data'), 'id'));
        $this->assertEqualsWithDelta(7, $otherResponse->json('meta.netTotal'), 0.001);
    }

    public function test_secretary_reads_the_pending_lists_and_physiotherapist_is_forbidden(): void
    {
        $tx              = $this->transaction($this->clinic, FinancialTransactionType::Saida, FinancialTransactionStatus::Pendente, 80, 0, '2026-09-10');
        $secretary       = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $physiotherapist = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);

        $this->assertSame([$tx->id], array_column($this->pending('saida', '2026-10-31', $secretary)->json('data'), 'id'));
        $this->actingAs($physiotherapist, 'clinic')
            ->getJson('/api/clinic/finances/transactions?status=pendente&type=saida&overdue_until=2026-10-31')
            ->assertForbidden();
    }

    public function test_overdue_until_must_be_a_full_date(): void
    {
        foreach (['2026-10', '31/10/2026', 'abc', '2026-02-30'] as $until) {
            $this->actingAs($this->admin, 'clinic')
                ->getJson("/api/clinic/finances/transactions?overdue_until={$until}")
                ->assertUnprocessable()
                ->assertJsonValidationErrors('overdue_until');
        }
    }

    public function test_other_listings_do_not_carry_the_net_total(): void
    {
        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/finances/transactions?period=2026-10')
            ->assertOk()
            ->assertJsonMissingPath('meta.netTotal');
    }

    /** @var array<string, FinancialCategory> */
    private array $categories = [];

    private function pending(string $type, string $until, ?ClinicUser $user = null, string $extra = ''): \Illuminate\Testing\TestResponse
    {
        return $this->actingAs($user ?? $this->admin, 'clinic')
            ->getJson("/api/clinic/finances/transactions?status=pendente&type={$type}&overdue_until={$until}{$extra}")
            ->assertOk();
    }

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
            'payment_method'        => PaymentMethod::Pix,
            'date'                  => $date,
            'gross_amount'          => $gross,
            'fee_amount'            => $fee,
            'net_amount'            => FinancialTransaction::computeNetAmount($gross, $fee),
        ]);
    }
}
