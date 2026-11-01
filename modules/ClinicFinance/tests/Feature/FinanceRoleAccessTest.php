<?php

namespace Modules\ClinicFinance\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route as RouteFacade;
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

/**
 * Quem entra em Finanças: administrador e secretária. Fisioterapeuta não.
 * A secretária não mexe em categoria (criar, ligar/desligar, excluir) nem no saldo inicial.
 */
class FinanceRoleAccessTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    private ClinicUser $secretary;

    private ClinicUser $physiotherapist;

    private FinancialCategory $customCategory;

    private FinancialTransaction $transaction;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(now()->startOfMonth()->addDays(14)->setTime(12, 0));
        $this->seed(FinancialCategorySeeder::class);

        $this->clinic          = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->admin           = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id]);
        $this->secretary       = $this->userWithRole($this->clinic, ClinicUser::ROLE_SECRETARY);
        $this->physiotherapist = $this->userWithRole($this->clinic, ClinicUser::ROLE_PHYSIOTHERAPIST);

        $this->customCategory = FinancialCategory::factory()->create([
            'clinic_id' => $this->clinic->id,
            'name'      => 'Categoria própria',
            'origin'    => FinancialCategoryOrigin::Custom,
        ]);

        $this->transaction = FinancialTransaction::factory()->create([
            'clinic_id'             => $this->clinic->id,
            'financial_category_id' => $this->systemCategory()->id,
            'created_by_user_id'    => $this->admin->id,
            'date'                  => now(),
            'description'           => 'Sessão de fisioterapia',
            'gross_amount'          => 150,
            'net_amount'            => 150,
        ]);
    }

    public function test_secretary_reads_summary_reports_categories_and_transactions(): void
    {
        $endpoints = [
            '/api/clinic/finances/summary',
            '/api/clinic/finances/transactions',
            "/api/clinic/finances/transactions/{$this->transaction->id}",
            '/api/clinic/finances/transactions/trash',
            '/api/clinic/finances/categories',
            '/api/clinic/finances/reports/summary',
            '/api/clinic/finances/reports/income-vs-expense',
            '/api/clinic/finances/reports/category-distribution',
            '/api/clinic/finances/reports/monthly-comparison',
            '/api/clinic/finances/reports/category-breakdown',
        ];

        foreach ($endpoints as $endpoint) {
            $this->actingAs($this->secretary, 'clinic')->getJson($endpoint)->assertOk();
        }
    }

    public function test_secretary_creates_updates_deletes_and_restores_transactions(): void
    {
        $this->actingAs($this->secretary, 'clinic')
            ->postJson('/api/clinic/finances/transactions', $this->transactionPayload(['description' => 'Lançado pela secretária']))
            ->assertCreated();
        $this->assertDatabaseHas('clinic_financial_transactions', [
            'clinic_id'   => $this->clinic->id,
            'description' => 'Lançado pela secretária',
        ]);

        $id = $this->transaction->id;
        $this->actingAs($this->secretary, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$id}", $this->transactionPayload(['description' => 'Editado pela secretária']))
            ->assertOk();
        $this->assertDatabaseHas('clinic_financial_transactions', ['id' => $id, 'description' => 'Editado pela secretária']);

        $this->actingAs($this->secretary, 'clinic')->deleteJson("/api/clinic/finances/transactions/{$id}")->assertNoContent();
        $this->assertSoftDeleted('clinic_financial_transactions', ['id' => $id]);

        $this->actingAs($this->secretary, 'clinic')->postJson("/api/clinic/finances/transactions/{$id}/restore")->assertOk();
        $this->assertDatabaseHas('clinic_financial_transactions', ['id' => $id, 'deleted_at' => null]);
    }

    public function test_secretary_exports_transactions(): void
    {
        $response = $this->actingAs($this->secretary, 'clinic')
            ->get('/api/clinic/finances/export?format=csv&range=current_month', ['Accept' => 'application/json'])
            ->assertOk();

        $this->assertStringContainsString('Sessão de fisioterapia', $response->streamedContent());
    }

    public function test_secretary_cannot_create_toggle_or_delete_categories(): void
    {
        $this->actingAs($this->secretary, 'clinic')
            ->postJson('/api/clinic/finances/categories', ['name' => 'Nova pela secretária', 'type' => FinancialTransactionType::Entrada->value])
            ->assertForbidden();
        $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/finances/categories/{$this->customCategory->id}/toggle-active")
            ->assertForbidden();
        $this->actingAs($this->secretary, 'clinic')
            ->deleteJson("/api/clinic/finances/categories/{$this->customCategory->id}")
            ->assertForbidden();

        $this->assertDatabaseMissing('clinic_financial_categories', ['name' => 'Nova pela secretária']);
        $this->assertDatabaseHas('clinic_financial_categories', ['id' => $this->customCategory->id, 'active' => true]);
    }

    public function test_secretary_cannot_change_opening_balance(): void
    {
        $this->actingAs($this->secretary, 'clinic')
            ->putJson('/api/clinic/finances/opening-balance', [
                'year'   => (int) now()->year,
                'month'  => (int) now()->month,
                'amount' => 500,
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('clinic_financial_opening_balances', ['clinic_id' => $this->clinic->id]);
    }

    public function test_physiotherapist_is_forbidden_on_every_finance_route(): void
    {
        $routes = $this->financeRoutes();
        $this->assertNotEmpty($routes);

        foreach ($routes as [$method, $uri]) {
            $this->actingAs($this->physiotherapist, 'clinic')
                ->json($method, $this->fillParameters($uri))
                ->assertForbidden();
        }

        $this->assertDatabaseHas('clinic_financial_transactions', ['id' => $this->transaction->id, 'deleted_at' => null]);
        $this->assertDatabaseHas('clinic_financial_categories', ['id' => $this->customCategory->id, 'active' => true]);
    }

    public function test_secretary_of_another_clinic_neither_sees_nor_changes_this_clinic_finances(): void
    {
        $otherSecretary = $this->userWithRole(Clinic::factory()->create(['timezone' => 'UTC']), ClinicUser::ROLE_SECRETARY);
        $id             = $this->transaction->id;

        $listed = collect($this->actingAs($otherSecretary, 'clinic')
            ->getJson('/api/clinic/finances/transactions')
            ->assertOk()
            ->json('data'))->pluck('id');
        $this->assertNotContains($id, $listed);

        $categories = collect($this->actingAs($otherSecretary, 'clinic')
            ->getJson('/api/clinic/finances/categories')
            ->assertOk()
            ->json('data'))->pluck('name');
        $this->assertNotContains('Categoria própria', $categories);

        $this->actingAs($otherSecretary, 'clinic')->getJson("/api/clinic/finances/transactions/{$id}")->assertNotFound();
        $this->actingAs($otherSecretary, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$id}", $this->transactionPayload(['description' => 'Alterado por outra clínica']))
            ->assertNotFound();
        $this->actingAs($otherSecretary, 'clinic')->deleteJson("/api/clinic/finances/transactions/{$id}")->assertNotFound();
        $this->assertDatabaseHas('clinic_financial_transactions', ['id' => $id, 'description' => 'Sessão de fisioterapia', 'deleted_at' => null]);

        $this->transaction->delete();
        $trash = collect($this->actingAs($otherSecretary, 'clinic')
            ->getJson('/api/clinic/finances/transactions/trash')
            ->assertOk()
            ->json('data'))->pluck('id');
        $this->assertNotContains($id, $trash);
        $this->actingAs($otherSecretary, 'clinic')->postJson("/api/clinic/finances/transactions/{$id}/restore")->assertNotFound();
        $this->assertSoftDeleted('clinic_financial_transactions', ['id' => $id]);
    }

    /**
     * Todas as rotas da API de Finanças, inclusive as que ainda vão nascer.
     *
     * @return array<int, array{0: string, 1: string}>
     */
    private function financeRoutes(): array
    {
        $routes = [];

        foreach (RouteFacade::getRoutes() as $route) {
            if (!str_starts_with($route->uri(), 'api/clinic/finances')) {
                continue;
            }

            foreach (array_diff($route->methods(), ['HEAD']) as $method) {
                $routes[] = [$method, $route->uri()];
            }
        }

        return $routes;
    }

    /** Troca os parâmetros por ids que existem, para a resposta não virar 404 antes da porta. */
    private function fillParameters(string $uri): string
    {
        return '/' . preg_replace_callback('/\{(\w+)\??\}/', fn (array $match) => (string) match ($match[1]) {
            'category' => $this->customCategory->id,
            default    => $this->transaction->id,
        }, $uri);
    }

    private function userWithRole(Clinic $clinic, string $role): ClinicUser
    {
        return ClinicUser::factory()->create(['clinic_id' => $clinic->id, 'role' => $role]);
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
            'gross_amount'          => 100,
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
