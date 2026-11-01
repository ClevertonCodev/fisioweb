<?php

namespace Modules\ClinicFinance\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Database\Seeders\FinancialCategorySeeder;
use Modules\ClinicFinance\Enums\FinancialCategoryOrigin;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Models\FinancialCategory;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Tests\TestCase;

/**
 * Seção de categorias das Configurações: lista também as desligadas (para poder religar),
 * enquanto a lista do lançamento só traz as ligadas.
 */
class FinanceCategorySettingsTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinicA;

    private Clinic $clinicB;

    private ClinicUser $adminA;

    private ClinicUser $adminB;

    private FinancialCategory $customA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(FinancialCategorySeeder::class);

        $this->clinicA = Clinic::factory()->create();
        $this->clinicB = Clinic::factory()->create();
        $this->adminA  = ClinicUser::factory()->create(['clinic_id' => $this->clinicA->id]);
        $this->adminB  = ClinicUser::factory()->create(['clinic_id' => $this->clinicB->id]);

        $this->customA = FinancialCategory::factory()->create([
            'clinic_id' => $this->clinicA->id,
            'name'      => 'Pilates A',
            'type'      => FinancialTransactionType::Entrada,
            'origin'    => FinancialCategoryOrigin::Custom,
            'active'    => true,
        ]);
    }

    public function test_settings_list_keeps_disabled_categories_with_active_false(): void
    {
        $system = $this->systemCategory();

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/finances/categories/{$system->id}/toggle-active")
            ->assertOk();
        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/finances/categories/{$this->customA->id}/toggle-active")
            ->assertOk();

        $rows = collect($this->actingAs($this->adminA, 'clinic')
            ->getJson('/api/clinic/finances/categories?include_inactive=1')
            ->assertOk()
            ->json('data'))->keyBy('id');

        $this->assertFalse($rows[$system->id]['active']);
        $this->assertFalse($rows[$this->customA->id]['active']);
        $this->assertArrayNotHasKey('disabled_for_clinic', $rows[$system->id]);
    }

    public function test_settings_list_of_another_clinic_does_not_show_its_categories_nor_its_switches(): void
    {
        $system = $this->systemCategory();
        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/finances/categories/{$system->id}/toggle-active")
            ->assertOk();
        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/finances/categories/{$this->customA->id}/toggle-active")
            ->assertOk();

        $rows = collect($this->actingAs($this->adminB, 'clinic')
            ->getJson('/api/clinic/finances/categories?include_inactive=1')
            ->assertOk()
            ->json('data'))->keyBy('id');

        $this->assertArrayNotHasKey($this->customA->id, $rows->all());
        $this->assertTrue($rows[$system->id]['active']);
    }

    public function test_toggle_returns_the_new_state_for_the_clinic(): void
    {
        $system = $this->systemCategory();

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/finances/categories/{$system->id}/toggle-active")
            ->assertOk()
            ->assertJsonPath('data.active', false);
        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/finances/categories/{$system->id}/toggle-active")
            ->assertOk()
            ->assertJsonPath('data.active', true);
        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/finances/categories/{$this->customA->id}/toggle-active")
            ->assertOk()
            ->assertJsonPath('data.active', false);
    }

    public function test_disabled_category_leaves_the_transaction_list(): void
    {
        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/finances/categories/{$this->customA->id}/toggle-active")
            ->assertOk();

        $names = collect($this->actingAs($this->adminA, 'clinic')
            ->getJson('/api/clinic/finances/categories?type=entrada')
            ->assertOk()
            ->json('data'))->pluck('name');
        $this->assertNotContains('Pilates A', $names);
    }

    public function test_deleting_a_category_with_transactions_answers_409_with_the_message(): void
    {
        FinancialTransaction::factory()->create([
            'clinic_id'             => $this->clinicA->id,
            'financial_category_id' => $this->customA->id,
            'created_by_user_id'    => $this->adminA->id,
            'type'                  => FinancialTransactionType::Entrada,
        ]);

        $this->actingAs($this->adminA, 'clinic')
            ->deleteJson("/api/clinic/finances/categories/{$this->customA->id}")
            ->assertStatus(409)
            ->assertJsonPath('message', 'Categoria possui transações; desative-a em vez de excluir.');

        $this->assertDatabaseHas('clinic_financial_categories', ['id' => $this->customA->id]);
    }

    public function test_category_used_only_by_a_transaction_in_the_trash_answers_409(): void
    {
        $id = $this->actingAs($this->adminA, 'clinic')
            ->postJson('/api/clinic/finances/transactions', $this->transactionPayload())
            ->assertCreated()
            ->json('data.id');
        $this->actingAs($this->adminA, 'clinic')->deleteJson("/api/clinic/finances/transactions/{$id}")->assertNoContent();

        $this->actingAs($this->adminA, 'clinic')
            ->deleteJson("/api/clinic/finances/categories/{$this->customA->id}")
            ->assertStatus(409)
            ->assertJsonPath('message', 'Categoria possui transações; desative-a em vez de excluir.');

        $this->assertDatabaseHas('clinic_financial_categories', ['id' => $this->customA->id]);
    }

    public function test_category_used_only_by_an_installment_series_answers_409(): void
    {
        $this->actingAs($this->adminA, 'clinic')
            ->postJson('/api/clinic/finances/transactions', $this->transactionPayload([
                'status' => 'pendente',
                'repeat' => ['kind' => 'installments', 'total' => 2],
            ]))
            ->assertCreated();
        // As duas parcelas mudam de categoria; a série continua apontando para a própria.
        $first = FinancialTransaction::query()->where('series_index', 1)->sole();
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$first->id}", $this->transactionPayload([
                'status'                => 'pendente',
                'gross_amount'          => '50.00',
                'financial_category_id' => $this->systemCategory()->id,
                'scope'                 => 'following',
            ]))
            ->assertOk();
        $this->assertSame(0, FinancialTransaction::withTrashed()->where('financial_category_id', $this->customA->id)->count());

        $this->actingAs($this->adminA, 'clinic')
            ->deleteJson("/api/clinic/finances/categories/{$this->customA->id}")
            ->assertStatus(409)
            ->assertJsonPath('message', 'Categoria possui transações; desative-a em vez de excluir.');

        $this->assertDatabaseHas('clinic_financial_categories', ['id' => $this->customA->id]);
    }

    public function test_unused_category_is_still_deleted(): void
    {
        $this->actingAs($this->adminA, 'clinic')
            ->deleteJson("/api/clinic/finances/categories/{$this->customA->id}")
            ->assertSuccessful();

        $this->assertDatabaseMissing('clinic_financial_categories', ['id' => $this->customA->id]);
    }

    private function transactionPayload(array $overrides = []): array
    {
        return array_merge([
            'date'                  => now()->toDateString(),
            'description'           => 'Aula de pilates',
            'financial_category_id' => $this->customA->id,
            'type'                  => FinancialTransactionType::Entrada->value,
            'status'                => 'recebido',
            'payment_method'        => 'pix',
            'gross_amount'          => 100,
            'fee_amount'            => 0,
        ], $overrides);
    }

    private function systemCategory(): FinancialCategory
    {
        return FinancialCategory::query()
            ->where('origin', FinancialCategoryOrigin::System->value)
            ->where('type', FinancialTransactionType::Entrada->value)
            ->firstOrFail();
    }
}
