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
use Tests\TestCase;

/**
 * O modal de lançamento do calendário de caixa (tarefa 006): lançar, editar e excluir
 * de verdade, pelas rotas que já existiam, e o que a tela espera de volta.
 */
class FinanceTransactionWriteTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $secretary;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(now()->setDate(2026, 10, 15)->setTime(12, 0));
        $this->seed(FinancialCategorySeeder::class);

        $this->clinic    = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->secretary = $this->userWithRole($this->clinic, ClinicUser::ROLE_SECRETARY);
    }

    public function test_deleting_a_transaction_sends_it_to_the_trash_and_out_of_calendar_and_summary(): void
    {
        $id = $this->createAs($this->secretary, ['gross_amount' => 100, 'fee_amount' => 3])
            ->assertCreated()
            ->json('data.id');

        $this->assertSame([['date' => '2026-10-15', 'income' => 97, 'expense' => 0]], $this->calendar($this->secretary));
        $this->assertEquals(97, $this->summary($this->secretary)['income']['received']);

        $this->actingAs($this->secretary, 'clinic')
            ->deleteJson("/api/clinic/finances/transactions/{$id}")
            ->assertNoContent();

        $this->assertSoftDeleted('clinic_financial_transactions', ['id' => $id]);
        $this->assertSame([], $this->calendar($this->secretary));
        $this->assertEquals(0, $this->summary($this->secretary)['income']['received']);
        $this->assertContains($id, $this->ids('/api/clinic/finances/transactions/trash', $this->secretary));
        $this->assertNotContains($id, $this->ids('/api/clinic/finances/transactions?from=2026-10-15&to=2026-10-15', $this->secretary));
    }

    public function test_editing_changes_the_transaction_and_recomputes_the_net_amount(): void
    {
        $id = $this->createAs($this->secretary)->assertCreated()->json('data.id');

        $this->actingAs($this->secretary, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$id}", $this->payload([
                'description'  => 'Sessão — Maria Souza',
                'gross_amount' => 200,
                'fee_amount'   => 6,
                'status'       => FinancialTransactionStatus::Pendente->value,
            ]))
            ->assertOk()
            ->assertJsonPath('data.description', 'Sessão — Maria Souza')
            ->assertJsonPath('data.status', 'pendente')
            ->assertJsonPath('data.net_amount', '194.00');

        $this->assertSame([['date' => '2026-10-15', 'income' => 194, 'expense' => 0]], $this->calendar($this->secretary));
    }

    public function test_fee_greater_than_the_amount_is_a_field_error(): void
    {
        $this->createAs($this->secretary, ['gross_amount' => 50, 'fee_amount' => 50.01])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['fee_amount']);

        $this->assertDatabaseCount('clinic_financial_transactions', 0);
    }

    public function test_category_of_another_clinic_is_refused_on_create_and_on_edit(): void
    {
        $other         = Clinic::factory()->create(['timezone' => 'UTC']);
        $foreign       = $this->customCategory($other);
        $id            = $this->createAs($this->secretary)->assertCreated()->json('data.id');
        $ownCategoryId = $this->systemCategory()->id;

        $this->createAs($this->secretary, ['financial_category_id' => $foreign->id])->assertUnprocessable();
        $this->actingAs($this->secretary, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$id}", $this->payload(['financial_category_id' => $foreign->id]))
            ->assertUnprocessable();

        $this->assertDatabaseCount('clinic_financial_transactions', 1);
        $this->assertDatabaseHas('clinic_financial_transactions', ['id' => $id, 'financial_category_id' => $ownCategoryId]);
    }

    public function test_secretary_of_another_clinic_cannot_edit_or_delete(): void
    {
        $id             = $this->createAs($this->secretary)->assertCreated()->json('data.id');
        $otherSecretary = $this->userWithRole(Clinic::factory()->create(['timezone' => 'UTC']), ClinicUser::ROLE_SECRETARY);

        $this->actingAs($otherSecretary, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$id}", $this->payload(['description' => 'Alterado']))
            ->assertNotFound();
        $this->actingAs($otherSecretary, 'clinic')
            ->deleteJson("/api/clinic/finances/transactions/{$id}")
            ->assertNotFound();

        $this->assertDatabaseHas('clinic_financial_transactions', ['id' => $id, 'description' => 'Sessão — Maria', 'deleted_at' => null]);
        $this->assertSame([], $this->calendar($otherSecretary));
    }

    public function test_category_breakdown_counts_by_category_and_type_for_the_modal_chips(): void
    {
        $income  = $this->systemCategory();
        $expense = $this->systemCategory(FinancialTransactionType::Saida);
        $this->createAs($this->secretary)->assertCreated();
        $this->createAs($this->secretary)->assertCreated();
        $this->createAs($this->secretary, [
            'type'                  => FinancialTransactionType::Saida->value,
            'status'                => FinancialTransactionStatus::Pago->value,
            'financial_category_id' => $expense->id,
            'payment_method'        => PaymentMethod::Pix->value,
        ])->assertCreated();

        $otherAdmin = ClinicUser::factory()->create(['clinic_id' => Clinic::factory()->create(['timezone' => 'UTC'])->id]);
        $this->createAs($otherAdmin)->assertCreated();

        $rows = collect($this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/finances/reports/category-breakdown?period=2026-10')
            ->assertOk()
            ->json('data'))
            ->mapWithKeys(fn (array $row) => ["{$row['type']}:{$row['category_id']}" => $row['count']]);

        $this->assertEquals(["entrada:{$income->id}" => 2, "saida:{$expense->id}" => 1], $rows->all());
    }

    private function createAs(ClinicUser $user, array $overrides = [])
    {
        return $this->actingAs($user, 'clinic')->postJson('/api/clinic/finances/transactions', $this->payload($overrides));
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'date'                  => '2026-10-15',
            'description'           => 'Sessão — Maria',
            'financial_category_id' => $this->systemCategory()->id,
            'type'                  => FinancialTransactionType::Entrada->value,
            'status'                => FinancialTransactionStatus::Recebido->value,
            'payment_method'        => PaymentMethod::CartaoCredito->value,
            'gross_amount'          => 100,
            'fee_amount'            => 0,
        ], $overrides);
    }

    private function calendar(ClinicUser $user): array
    {
        return $this->actingAs($user, 'clinic')
            ->getJson('/api/clinic/finances/calendar?period=2026-10')
            ->assertOk()
            ->json('data.days');
    }

    private function summary(ClinicUser $user): array
    {
        return $this->actingAs($user, 'clinic')
            ->getJson('/api/clinic/finances/summary?period=2026-10')
            ->assertOk()
            ->json('data');
    }

    private function ids(string $url, ClinicUser $user): array
    {
        return collect($this->actingAs($user, 'clinic')->getJson($url)->assertOk()->json('data'))
            ->pluck('id')
            ->all();
    }

    private function systemCategory(FinancialTransactionType $type = FinancialTransactionType::Entrada): FinancialCategory
    {
        return FinancialCategory::query()
            ->whereNull('clinic_id')
            ->where('type', $type->value)
            ->firstOrFail();
    }

    private function customCategory(Clinic $clinic): FinancialCategory
    {
        return FinancialCategory::factory()->create([
            'clinic_id' => $clinic->id,
            'name'      => 'Própria',
            'type'      => FinancialTransactionType::Entrada->value,
            'origin'    => FinancialCategoryOrigin::Custom,
        ]);
    }

    private function userWithRole(Clinic $clinic, string $role): ClinicUser
    {
        return ClinicUser::factory()->create(['clinic_id' => $clinic->id, 'role' => $role]);
    }
}
