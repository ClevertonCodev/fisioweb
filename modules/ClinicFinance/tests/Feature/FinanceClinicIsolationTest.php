<?php

namespace Modules\ClinicFinance\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Database\Seeders\FinancialCategorySeeder;
use Modules\ClinicFinance\Enums\FinancialCategoryOrigin;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Enums\PaymentMethod;
use Modules\ClinicFinance\Models\FinancialCategory;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Tests\TestCase;

class FinanceClinicIsolationTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinicA;

    private Clinic $clinicB;

    private ClinicUser $adminA;

    private ClinicUser $adminB;

    private FinancialCategory $customCategoryA;

    private FinancialTransaction $transactionA;

    protected function setUp(): void
    {
        parent::setUp();

        // Meio do mês e fuso UTC: o lançamento cai no "mês atual" de qualquer clínica,
        // sem depender da hora em que a suíte roda (virada de mês em America/Sao_Paulo).
        $this->travelTo(now()->startOfMonth()->addDays(14)->setTime(12, 0));
        $this->seed(FinancialCategorySeeder::class);

        $this->clinicA = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->clinicB = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->adminA  = ClinicUser::factory()->create(['clinic_id' => $this->clinicA->id]);
        $this->adminB  = ClinicUser::factory()->create(['clinic_id' => $this->clinicB->id]);

        $this->customCategoryA = FinancialCategory::factory()->create([
            'clinic_id' => $this->clinicA->id,
            'name'      => 'Categoria própria A',
            'origin'    => FinancialCategoryOrigin::Custom,
        ]);

        $this->transactionA = FinancialTransaction::factory()->create([
            'clinic_id'             => $this->clinicA->id,
            'financial_category_id' => $this->systemCategory()->id,
            'created_by_user_id'    => $this->adminA->id,
            'date'                  => now(),
            'gross_amount'          => 1234.56,
            'net_amount'            => 1234.56,
        ]);
    }

    public function test_transactions_index_does_not_list_another_clinic_transactions(): void
    {
        $ids = collect($this->actingAs($this->adminB, 'clinic')
            ->getJson('/api/clinic/finances/transactions')
            ->assertOk()
            ->json('data'))->pluck('id');

        $this->assertNotContains($this->transactionA->id, $ids);
    }

    public function test_transaction_of_another_clinic_cannot_be_read_updated_or_deleted(): void
    {
        $id = $this->transactionA->id;

        $this->actingAs($this->adminB, 'clinic')->getJson("/api/clinic/finances/transactions/{$id}")->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$id}", $this->transactionPayload(['description' => 'Alterado por B']))
            ->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')->deleteJson("/api/clinic/finances/transactions/{$id}")->assertNotFound();

        $this->assertDatabaseHas('clinic_financial_transactions', [
            'id'          => $id,
            'description' => $this->transactionA->description,
            'deleted_at'  => null,
        ]);
    }

    public function test_trash_and_restore_do_not_reach_another_clinic_transactions(): void
    {
        $this->transactionA->delete();

        $ids = collect($this->actingAs($this->adminB, 'clinic')
            ->getJson('/api/clinic/finances/transactions/trash')
            ->assertOk()
            ->json('data'))->pluck('id');
        $this->assertNotContains($this->transactionA->id, $ids);

        $this->actingAs($this->adminB, 'clinic')
            ->postJson("/api/clinic/finances/transactions/{$this->transactionA->id}/restore")
            ->assertNotFound();

        $this->assertSoftDeleted('clinic_financial_transactions', ['id' => $this->transactionA->id]);
    }

    public function test_categories_of_another_clinic_are_not_listed_toggled_or_deleted(): void
    {
        $names = collect($this->actingAs($this->adminB, 'clinic')
            ->getJson('/api/clinic/finances/categories')
            ->assertOk()
            ->json('data'))->pluck('name');
        $this->assertNotContains('Categoria própria A', $names);

        $this->actingAs($this->adminB, 'clinic')
            ->postJson("/api/clinic/finances/categories/{$this->customCategoryA->id}/toggle-active")
            ->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')
            ->deleteJson("/api/clinic/finances/categories/{$this->customCategoryA->id}")
            ->assertNotFound();

        $this->assertDatabaseHas('clinic_financial_categories', ['id' => $this->customCategoryA->id, 'active' => true]);
    }

    public function test_summary_and_reports_of_another_clinic_ignore_this_clinic_transactions(): void
    {
        $endpoints = [
            '/api/clinic/finances/summary',
            '/api/clinic/finances/reports/summary',
            '/api/clinic/finances/reports/income-vs-expense',
            '/api/clinic/finances/reports/category-distribution',
            '/api/clinic/finances/reports/monthly-comparison',
            '/api/clinic/finances/reports/category-breakdown',
        ];

        $withA = $this->fetchAll($endpoints, $this->adminB);
        $this->transactionA->forceDelete();
        $withoutA = $this->fetchAll($endpoints, $this->adminB);

        foreach ($endpoints as $endpoint) {
            $this->assertSame($withoutA[$endpoint], $withA[$endpoint], "{$endpoint} da clínica B mudou com lançamento da clínica A");
        }
    }

    public function test_export_of_another_clinic_does_not_include_this_clinic_transactions(): void
    {
        $this->actingAs($this->adminB, 'clinic')
            ->getJson('/api/clinic/finances/export?format=csv&range=current_month')
            ->assertUnprocessable()
            ->assertJsonPath('message', 'intervalo sem transações para exportar');

        FinancialTransaction::factory()->create([
            'clinic_id'             => $this->clinicB->id,
            'financial_category_id' => $this->systemCategory()->id,
            'created_by_user_id'    => $this->adminB->id,
            'date'                  => now(),
            'description'           => 'Lançamento exclusivo da B',
        ]);

        $csv = $this->exportCsvAs($this->adminB);
        $this->assertStringContainsString('Lançamento exclusivo da B', $csv);
        $this->assertStringNotContainsString($this->transactionA->description, $csv);
    }

    public function test_export_of_own_clinic_includes_own_transactions(): void
    {
        $this->assertStringContainsString($this->transactionA->description, $this->exportCsvAs($this->adminA));
    }

    public function test_summary_and_reports_of_own_clinic_count_own_transactions(): void
    {
        $endpoints = [
            '/api/clinic/finances/summary',
            '/api/clinic/finances/reports/summary',
            '/api/clinic/finances/reports/income-vs-expense',
            '/api/clinic/finances/reports/category-distribution',
            '/api/clinic/finances/reports/monthly-comparison',
            '/api/clinic/finances/reports/category-breakdown',
        ];

        $withA = $this->fetchAll($endpoints, $this->adminA);
        $this->transactionA->forceDelete();
        $withoutA = $this->fetchAll($endpoints, $this->adminA);

        foreach ($endpoints as $endpoint) {
            $this->assertNotSame($withoutA[$endpoint], $withA[$endpoint], "{$endpoint} da clínica A não contou o próprio lançamento");
        }
    }

    public function test_own_transactions_can_be_listed_updated_deleted_and_restored(): void
    {
        $ids = collect($this->actingAs($this->adminA, 'clinic')
            ->getJson('/api/clinic/finances/transactions')
            ->assertOk()
            ->json('data'))->pluck('id');
        $this->assertContains($this->transactionA->id, $ids);

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$this->transactionA->id}", $this->transactionPayload(['description' => 'Editado por A']))
            ->assertOk();
        $this->assertDatabaseHas('clinic_financial_transactions', ['id' => $this->transactionA->id, 'description' => 'Editado por A']);

        $this->actingAs($this->adminA, 'clinic')
            ->deleteJson("/api/clinic/finances/transactions/{$this->transactionA->id}")
            ->assertNoContent();
        $this->assertSoftDeleted('clinic_financial_transactions', ['id' => $this->transactionA->id]);

        $trash = collect($this->actingAs($this->adminA, 'clinic')
            ->getJson('/api/clinic/finances/transactions/trash')
            ->assertOk()
            ->json('data'))->pluck('id');
        $this->assertContains($this->transactionA->id, $trash);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/finances/transactions/{$this->transactionA->id}/restore")
            ->assertOk();
        $this->assertDatabaseHas('clinic_financial_transactions', ['id' => $this->transactionA->id, 'deleted_at' => null]);
    }

    public function test_own_custom_categories_can_be_listed_created_toggled_and_deleted(): void
    {
        $names = collect($this->actingAs($this->adminA, 'clinic')
            ->getJson('/api/clinic/finances/categories')
            ->assertOk()
            ->json('data'))->pluck('name');
        $this->assertContains('Categoria própria A', $names);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson('/api/clinic/finances/categories', ['name' => 'Nova categoria A', 'type' => FinancialTransactionType::Entrada->value])
            ->assertCreated();
        $this->assertDatabaseHas('clinic_financial_categories', ['name' => 'Nova categoria A', 'clinic_id' => $this->clinicA->id]);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/finances/categories/{$this->customCategoryA->id}/toggle-active")
            ->assertOk();
        $this->assertDatabaseHas('clinic_financial_categories', ['id' => $this->customCategoryA->id, 'active' => false]);

        $this->actingAs($this->adminA, 'clinic')
            ->deleteJson("/api/clinic/finances/categories/{$this->customCategoryA->id}")
            ->assertNoContent();
        $this->assertDatabaseMissing('clinic_financial_categories', ['id' => $this->customCategoryA->id]);
    }

    public function test_opening_balance_is_written_only_for_own_clinic(): void
    {
        $this->actingAs($this->adminB, 'clinic')
            ->putJson('/api/clinic/finances/opening-balance', [
                'year'   => (int) now()->year,
                'month'  => (int) now()->month,
                'amount' => 500,
            ])
            ->assertOk();

        $this->assertDatabaseHas('clinic_financial_opening_balances', ['clinic_id' => $this->clinicB->id, 'updated_by_user_id' => $this->adminB->id]);
        $this->assertDatabaseMissing('clinic_financial_opening_balances', ['clinic_id' => $this->clinicA->id]);
    }

    private function fetchAll(array $endpoints, ClinicUser $user): array
    {
        $responses = [];
        foreach ($endpoints as $endpoint) {
            $responses[$endpoint] = $this->actingAs($user, 'clinic')->getJson($endpoint)->assertOk()->json();
        }

        return $responses;
    }

    private function exportCsvAs(ClinicUser $user): string
    {
        $response = $this->actingAs($user, 'clinic')
            ->get('/api/clinic/finances/export?format=csv&range=current_month', ['Accept' => 'application/json'])
            ->assertOk();

        return $response->baseResponse instanceof \Symfony\Component\HttpFoundation\StreamedResponse
            ? $response->streamedContent()
            : (string) $response->getContent();
    }

    private function transactionPayload(array $overrides = []): array
    {
        return array_merge([
            'date'                  => now()->toDateString(),
            'description'           => 'Lançamento',
            'financial_category_id' => $this->systemCategory()->id,
            'type'                  => FinancialTransactionType::Entrada->value,
            'status'                => FinancialTransactionStatus::Recebido->value,
            'payment_method'        => PaymentMethod::Pix->value,
            'gross_amount'          => 1,
        ], $overrides);
    }

    private function systemCategory(): FinancialCategory
    {
        return FinancialCategory::query()
            ->whereNull('clinic_id')
            ->where('type', FinancialTransactionType::Entrada->value)
            ->firstOrFail();
    }
}
