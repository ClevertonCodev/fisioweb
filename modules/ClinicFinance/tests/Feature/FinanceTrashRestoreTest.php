<?php

namespace Modules\ClinicFinance\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Database\Seeders\FinancialCategorySeeder;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Enums\PaymentMethod;
use Modules\ClinicFinance\Models\FinancialCategory;
use Tests\TestCase;

/**
 * A lixeira das Configurações (tarefa 010): restaurar tira da lixeira e devolve
 * o lançamento ao calendário e ao resumo do mês de origem; outra clínica não
 * vê nem restaura.
 */
class FinanceTrashRestoreTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $secretary;

    private ClinicUser $otherAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(now()->setDate(2026, 10, 20)->setTime(12, 0));
        $this->seed(FinancialCategorySeeder::class);

        $clinic           = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->secretary  = ClinicUser::factory()->create(['clinic_id' => $clinic->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $this->otherAdmin = ClinicUser::factory()->create(['clinic_id' => Clinic::factory()->create(['timezone' => 'UTC'])->id]);
    }

    public function test_restoring_takes_it_out_of_the_trash_and_back_to_the_calendar_and_summary(): void
    {
        $id = $this->createAndDelete();
        $this->assertSame([], $this->calendar($this->secretary));

        $restored = $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/finances/transactions/{$id}/restore")
            ->assertOk()
            ->assertJsonPath('data.id', $id)
            ->assertJsonPath('data.deleted_at', null);
        // A tela usa a data devolvida no aviso "Ele voltou para 15/10/2026".
        $this->assertStringStartsWith('2026-10-15', $restored->json('data.date'));

        $this->assertNotContains($id, $this->trashIds($this->secretary));
        $this->assertSame([['date' => '2026-10-15', 'income' => 97, 'expense' => 0]], $this->calendar($this->secretary));
        $this->assertEquals(97, $this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/finances/summary?period=2026-10')
            ->assertOk()
            ->json('data.income.received'));
    }

    public function test_another_clinic_does_not_see_or_restore_the_trashed_transaction(): void
    {
        $id = $this->createAndDelete();

        $this->assertNotContains($id, $this->trashIds($this->otherAdmin));
        $this->actingAs($this->otherAdmin, 'clinic')
            ->postJson("/api/clinic/finances/transactions/{$id}/restore")
            ->assertNotFound();

        $this->assertSoftDeleted('clinic_financial_transactions', ['id' => $id]);
        $this->assertContains($id, $this->trashIds($this->secretary));
        $this->assertSame([], $this->calendar($this->secretary));
    }

    public function test_the_trash_lists_every_month_with_the_last_deleted_first_and_restores_to_the_original_month(): void
    {
        $august  = $this->createAndDelete('2026-08-10');
        $october = $this->createAndDelete();
        $this->travel(1)->minutes();
        $june = $this->createAndDelete('2026-06-01');

        $this->assertSame([$june, $october, $august], $this->trashIds($this->secretary));

        $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/finances/transactions/{$august}/restore")
            ->assertOk();

        $this->assertSame([['date' => '2026-08-10', 'income' => 97, 'expense' => 0]], $this->calendar($this->secretary, '2026-08'));
        $this->assertSame([$june, $october], $this->trashIds($this->secretary));
    }

    public function test_the_trash_is_paginated(): void
    {
        foreach (range(1, 11) as $_) {
            $this->createAndDelete();
        }

        $this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/finances/transactions/trash?per_page=10&page=2')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.page', 2)
            ->assertJsonPath('meta.perPage', 10)
            ->assertJsonPath('meta.total', 11);
    }

    private function createAndDelete(string $date = '2026-10-15'): int
    {
        $category = FinancialCategory::query()
            ->whereNull('clinic_id')
            ->where('type', FinancialTransactionType::Entrada->value)
            ->firstOrFail();

        $id = $this->actingAs($this->secretary, 'clinic')
            ->postJson('/api/clinic/finances/transactions', [
                'date'                  => $date,
                'description'           => 'Sessão — Maria',
                'financial_category_id' => $category->id,
                'type'                  => FinancialTransactionType::Entrada->value,
                'status'                => FinancialTransactionStatus::Recebido->value,
                'payment_method'        => PaymentMethod::CartaoCredito->value,
                'gross_amount'          => 100,
                'fee_amount'            => 3,
            ])
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($this->secretary, 'clinic')
            ->deleteJson("/api/clinic/finances/transactions/{$id}")
            ->assertNoContent();

        return $id;
    }

    private function calendar(ClinicUser $user, string $period = '2026-10'): array
    {
        return $this->actingAs($user, 'clinic')
            ->getJson("/api/clinic/finances/calendar?period={$period}")
            ->assertOk()
            ->json('data.days');
    }

    private function trashIds(ClinicUser $user): array
    {
        return collect($this->actingAs($user, 'clinic')
            ->getJson('/api/clinic/finances/transactions/trash')
            ->assertOk()
            ->json('data'))
            ->pluck('id')
            ->all();
    }
}
