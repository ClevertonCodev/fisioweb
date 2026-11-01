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
use Modules\ClinicFinance\Models\FinancialTransaction;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\Patient\Models\Patient;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Parcelamento (tarefa 015): um valor total em N parcelas, uma por mês, e
 * "só esta" / "esta e as próximas" na edição e na exclusão.
 */
class FinanceInstallmentsTest extends TestCase
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

    public function test_splits_amount_and_fee_with_the_leftover_cent_in_the_first_installment(): void
    {
        $this->createAs($this->secretary, [
            'gross_amount' => 100,
            'fee_amount'   => 3,
            'repeat'       => ['kind' => 'installments', 'total' => 3],
        ])->assertCreated();

        $rows = $this->installments();

        $this->assertSame(['33.34', '33.33', '33.33'], $rows->pluck('gross_amount')->all());
        $this->assertSame(['1.00', '1.00', '1.00'], $rows->pluck('fee_amount')->all());
        $this->assertSame(['32.34', '32.33', '32.33'], $rows->pluck('net_amount')->all());
    }

    public function test_one_installment_per_month_and_day_31_falls_on_the_last_day_of_short_months(): void
    {
        $this->createAs($this->secretary, [
            'date'   => '2027-01-31',
            'repeat' => ['kind' => 'installments', 'total' => 4],
        ])->assertCreated();

        $this->assertSame(
            ['2027-01-31', '2027-02-28', '2027-03-31', '2027-04-30'],
            $this->installments()->map(fn ($t) => $t->date->toDateString())->all(),
        );
    }

    public function test_first_keeps_the_chosen_status_the_others_are_pending_and_numbered(): void
    {
        $response = $this->createAs($this->secretary, [
            'description' => 'Pacote',
            'status'      => FinancialTransactionStatus::Recebido->value,
            'repeat'      => ['kind' => 'installments', 'total' => 3],
        ])->assertCreated();

        $rows = $this->installments();
        $this->assertSame(['Pacote (1/3)', 'Pacote (2/3)', 'Pacote (3/3)'], $rows->pluck('description')->all());
        $this->assertSame(['recebido', 'pendente', 'pendente'], $rows->map(fn ($t) => $t->status->value)->all());

        $response
            ->assertJsonPath('data.id', $rows->first()->id)
            ->assertJsonPath('data.description', 'Pacote (1/3)')
            ->assertJsonPath('data.series.kind', 'installments')
            ->assertJsonPath('data.series.index', 1)
            ->assertJsonPath('data.series.total', 3)
            ->assertJsonPath('meta.createdCount', 3)
            // camelCase como o `meta` da listagem (perPage, netTotal).
            ->assertJsonMissingPath('meta.created_count');
    }

    public function test_without_repeat_creates_a_single_transaction_without_series(): void
    {
        $this->createAs($this->secretary, ['repeat' => ['kind' => 'none']])
            ->assertCreated()
            ->assertJsonPath('data.series', null)
            ->assertJsonPath('meta.createdCount', 1);

        $this->assertDatabaseCount('clinic_financial_transactions', 1);
        $this->assertDatabaseCount('clinic_financial_series', 0);
    }

    #[DataProvider('invalidTotals')]
    public function test_installments_outside_2_to_48_is_a_field_error(mixed $total): void
    {
        $this->createAs($this->secretary, ['repeat' => ['kind' => 'installments', 'total' => $total]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['repeat.total']);

        $this->assertDatabaseCount('clinic_financial_transactions', 0);
        $this->assertDatabaseCount('clinic_financial_series', 0);
    }

    public static function invalidTotals(): array
    {
        return ['1' => [1], '49' => [49], 'vazio' => [null], 'texto' => ['dez']];
    }

    public function test_48_installments_is_accepted(): void
    {
        $this->createAs($this->secretary, ['repeat' => ['kind' => 'installments', 'total' => 48]])
            ->assertCreated()
            ->assertJsonPath('meta.createdCount', 48);

        $this->assertSame('2030-09-15', $this->installments()->last()->date->toDateString());
    }

    public function test_less_than_one_cent_per_installment_is_a_field_error(): void
    {
        // R$ 0,02 em 3x daria 0,02 + 0,00 + 0,00, e a parcela de zero nem se edita depois (gt:0).
        $this->createAs($this->secretary, [
            'gross_amount' => 0.02,
            'repeat'       => ['kind' => 'installments', 'total' => 3],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['gross_amount']);
        $this->assertDatabaseCount('clinic_financial_transactions', 0);
        $this->assertDatabaseCount('clinic_financial_series', 0);

        $this->createAs($this->secretary, [
            'gross_amount' => 0.03,
            'repeat'       => ['kind' => 'installments', 'total' => 3],
        ])->assertCreated();
        $this->assertSame(['0.01', '0.01', '0.01'], $this->installments()->pluck('gross_amount')->all());
    }

    public function test_put_following_changes_this_and_the_next_pending_but_not_the_paid_ones(): void
    {
        $rows = $this->sixInstallments();
        // A 5ª já foi recebida: "esta e as próximas" não mexe nela.
        $rows[4]->update(['status' => FinancialTransactionStatus::Recebido]);
        $newCategory = $this->otherIncomeCategory();

        $this->actingAs($this->secretary, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$rows[3]->id}", $this->payload([
                'date'                  => $rows[3]->date->toDateString(),
                'description'           => 'Maca nova (4/6)',
                'financial_category_id' => $newCategory->id,
                'gross_amount'          => $rows[3]->gross_amount,
                'status'                => FinancialTransactionStatus::Pendente->value,
                'scope'                 => 'following',
            ]))
            ->assertOk()
            ->assertJsonPath('data.description', 'Maca nova (4/6)');

        $after = $this->installments();
        $this->assertSame(
            [$this->categoryId(), $this->categoryId(), $this->categoryId(), $newCategory->id, $this->categoryId(), $newCategory->id],
            $after->pluck('financial_category_id')->map(fn ($id) => (int) $id)->all(),
        );
        $this->assertSame(
            ['Maca (1/6)', 'Maca (2/6)', 'Maca (3/6)', 'Maca nova (4/6)', 'Maca (5/6)', 'Maca nova (6/6)'],
            $after->pluck('description')->all(),
        );
        // O valor não mudou nesta: as próximas ficam com o delas, e as datas não andam.
        $this->assertSame($rows->pluck('gross_amount')->all(), $after->pluck('gross_amount')->all());
        $this->assertSame(
            $rows->map(fn ($t) => $t->date->toDateString())->all(),
            $after->map(fn ($t) => $t->date->toDateString())->all(),
        );
    }

    public function test_put_following_with_a_new_amount_recomputes_the_net_of_the_next_ones(): void
    {
        $rows = $this->sixInstallments();

        $this->actingAs($this->secretary, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$rows[4]->id}", $this->payload([
                'date'         => $rows[4]->date->toDateString(),
                'description'  => $rows[4]->description,
                'gross_amount' => 120,
                'fee_amount'   => 2,
                'status'       => FinancialTransactionStatus::Pendente->value,
                'scope'        => 'following',
            ]))
            ->assertOk();

        $after = $this->installments();
        $this->assertSame(['100.00', '100.00', '100.00', '100.00', '120.00', '120.00'], $after->pluck('gross_amount')->all());
        $this->assertSame(['100.00', '100.00', '100.00', '100.00', '118.00', '118.00'], $after->pluck('net_amount')->all());
    }

    public function test_put_following_on_the_first_keeps_the_amount_of_the_next_ones_when_it_did_not_change(): void
    {
        $this->createAs($this->secretary, [
            'description' => 'Pacote',
            'status'      => FinancialTransactionStatus::Pendente->value,
            'repeat'      => ['kind' => 'installments', 'total' => 3],
        ])->assertCreated();
        $first = $this->installments()->first();

        // O modal manda o formulário inteiro: o valor da 1ª (33,34) vem junto, sem mudar.
        $this->actingAs($this->secretary, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$first->id}", $this->payload([
                'description'    => 'Pacote (1/3)',
                'payment_method' => PaymentMethod::Pix->value,
                'gross_amount'   => '33.34',
                'status'         => FinancialTransactionStatus::Pendente->value,
                'scope'          => 'following',
            ]))
            ->assertOk();

        $after = $this->installments();
        $this->assertSame(['33.34', '33.33', '33.33'], $after->pluck('gross_amount')->all());
        $this->assertSame(['pix', 'pix', 'pix'], $after->map(fn ($t) => $t->payment_method->value)->all());
    }

    public function test_put_only_changes_just_this_installment(): void
    {
        $rows = $this->sixInstallments();

        $this->actingAs($this->secretary, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$rows[1]->id}", $this->payload([
                'date'                  => $rows[1]->date->toDateString(),
                'description'           => 'Maca (2/6)',
                'financial_category_id' => $this->otherIncomeCategory()->id,
                'gross_amount'          => 100,
                'status'                => FinancialTransactionStatus::Pendente->value,
                'scope'                 => 'only',
            ]))
            ->assertOk();

        $changed = $this->installments()->filter(fn ($t) => (int) $t->financial_category_id !== $this->categoryId());
        $this->assertSame([$rows[1]->id], $changed->pluck('id')->values()->all());
    }

    public function test_rewritten_description_keeps_the_installment_number_on_only_and_on_following(): void
    {
        $rows = $this->sixInstallments();

        $this->actingAs($this->secretary, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$rows[1]->id}", $this->payload([
                'date'        => $rows[1]->date->toDateString(),
                'description' => 'Maca dobrável',
                'status'      => FinancialTransactionStatus::Pendente->value,
                'scope'       => 'only',
            ]))
            ->assertOk()
            ->assertJsonPath('data.description', 'Maca dobrável (2/6)');

        $this->actingAs($this->secretary, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$rows[3]->id}", $this->payload([
                'date'        => $rows[3]->date->toDateString(),
                'description' => 'Maca nova',
                'status'      => FinancialTransactionStatus::Pendente->value,
                'scope'       => 'following',
            ]))
            ->assertOk()
            ->assertJsonPath('data.description', 'Maca nova (4/6)');

        $this->assertSame(
            ['Maca (1/6)', 'Maca dobrável (2/6)', 'Maca (3/6)', 'Maca nova (4/6)', 'Maca nova (5/6)', 'Maca nova (6/6)'],
            $this->installments()->pluck('description')->all(),
        );
    }

    public function test_a_number_typed_in_the_description_is_kept_on_create_and_on_edit(): void
    {
        // "(10/10)" é da pessoa (o pacote de 10 sessões), não do sistema: fica, e a parcela vem depois.
        $this->createAs($this->secretary, [
            'description' => 'Pacote (10/10)',
            'status'      => FinancialTransactionStatus::Pendente->value,
            'repeat'      => ['kind' => 'installments', 'total' => 3],
        ])->assertCreated()->assertJsonPath('data.description', 'Pacote (10/10) (1/3)');
        $rows = $this->installments();
        $this->assertSame(['Pacote (10/10) (1/3)', 'Pacote (10/10) (2/3)', 'Pacote (10/10) (3/3)'], $rows->pluck('description')->all());

        // Na edição sai só o "(2/3)" que o sistema pôs; o "(10/10)" digitado continua.
        $this->actingAs($this->secretary, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$rows[1]->id}", $this->payload([
                'date'         => $rows[1]->date->toDateString(),
                'description'  => 'Pacote novo (10/10) (2/3)',
                'gross_amount' => $rows[1]->gross_amount,
                'status'       => FinancialTransactionStatus::Pendente->value,
                'scope'        => 'following',
            ]))
            ->assertOk()
            ->assertJsonPath('data.description', 'Pacote novo (10/10) (2/3)');

        $this->actingAs($this->secretary, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$rows[0]->id}", $this->payload([
                'date'         => $rows[0]->date->toDateString(),
                'description'  => 'Avaliação (5/5)',
                'gross_amount' => $rows[0]->gross_amount,
                'status'       => FinancialTransactionStatus::Pendente->value,
                'scope'        => 'only',
            ]))
            ->assertOk()
            ->assertJsonPath('data.description', 'Avaliação (5/5) (1/3)');

        $this->assertSame(
            ['Avaliação (5/5) (1/3)', 'Pacote novo (10/10) (2/3)', 'Pacote novo (10/10) (3/3)'],
            $this->installments()->pluck('description')->all(),
        );
    }

    public function test_put_following_turning_income_into_expense_clears_the_patient_of_the_next_ones(): void
    {
        $patient     = Patient::factory()->create(['clinic_id' => $this->clinic->id]);
        $appointment = Appointment::factory()->create([
            'clinic_id'      => $this->clinic->id,
            'patient_id'     => $patient->id,
            'clinic_user_id' => $this->userWithRole($this->clinic, ClinicUser::ROLE_PHYSIOTHERAPIST)->id,
            'starts_at'      => '2026-10-15 09:00:00',
            'ends_at'        => '2026-10-15 10:00:00',
        ]);
        $this->createAs($this->secretary, [
            'description'    => 'Pacote',
            'status'         => FinancialTransactionStatus::Pendente->value,
            'patient_id'     => $patient->id,
            'appointment_id' => $appointment->id,
            'repeat'         => ['kind' => 'installments', 'total' => 3],
        ])->assertCreated();
        $first = $this->installments()->first();
        $this->assertSame([$patient->id, $patient->id, $patient->id], $this->installments()->pluck('patient_id')->all());
        // Com atendimento nas três: senão a conferência de `appointment_id` nulo lá embaixo não prova nada.
        $this->assertSame([$appointment->id, $appointment->id, $appointment->id], $this->installments()->pluck('appointment_id')->all());

        $this->actingAs($this->secretary, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$first->id}", $this->payload([
                'description'           => 'Pacote (1/3)',
                'type'                  => FinancialTransactionType::Saida->value,
                'status'                => FinancialTransactionStatus::Pendente->value,
                'financial_category_id' => $this->systemCategory(FinancialTransactionType::Saida)->id,
                'gross_amount'          => '33.34',
                'scope'                 => 'following',
            ]))
            ->assertOk();

        $after = $this->installments();
        $this->assertSame(['saida', 'saida', 'saida'], $after->map(fn ($t) => $t->type->value)->all());
        $this->assertSame([null, null, null], $after->pluck('patient_id')->all());
        $this->assertSame([null, null, null], $after->pluck('appointment_id')->all());
    }

    public function test_put_following_leaves_alone_an_installment_settled_while_the_edit_runs(): void
    {
        $rows = $this->sixInstallments();
        // Outra pessoa dá baixa na 5ª depois que a edição já buscou as próximas pendentes.
        $settled = false;
        FinancialTransaction::updated(function (FinancialTransaction $updated) use ($rows, &$settled) {
            if ($settled || (int) $updated->id !== (int) $rows[2]->id) {
                return;
            }
            $settled = true;
            FinancialTransaction::query()->whereKey($rows[4]->id)->toBase()->update(['status' => FinancialTransactionStatus::Recebido->value]);
        });

        $this->actingAs($this->secretary, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$rows[1]->id}", $this->payload([
                'date'         => $rows[1]->date->toDateString(),
                'description'  => $rows[1]->description,
                'gross_amount' => 120,
                'status'       => FinancialTransactionStatus::Pendente->value,
                'scope'        => 'following',
            ]))
            ->assertOk();

        $this->assertTrue($settled);
        $after = $this->installments();
        $this->assertSame(['100.00', '120.00', '120.00', '120.00', '100.00', '120.00'], $after->pluck('gross_amount')->all());
        $this->assertSame(FinancialTransactionStatus::Recebido, $after[4]->status);
    }

    public function test_delete_following_sends_this_and_the_next_pending_to_the_trash(): void
    {
        $rows = $this->sixInstallments();
        $rows[4]->update(['status' => FinancialTransactionStatus::Recebido]);

        $this->actingAs($this->secretary, 'clinic')
            ->deleteJson("/api/clinic/finances/transactions/{$rows[2]->id}?scope=following")
            ->assertNoContent();

        $this->assertSame(
            [$rows[0]->id, $rows[1]->id, $rows[4]->id],
            $this->installments()->pluck('id')->all(),
        );
        $trash = collect($this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/finances/transactions/trash?from=2026-01-01&to=2027-12-31')
            ->assertOk()
            ->json('data'))->pluck('id')->sort()->values()->all();
        $this->assertSame([$rows[2]->id, $rows[3]->id, $rows[5]->id], $trash);
    }

    public function test_delete_without_scope_sends_only_this_installment_to_the_trash(): void
    {
        $rows = $this->sixInstallments();

        $this->actingAs($this->secretary, 'clinic')
            ->deleteJson("/api/clinic/finances/transactions/{$rows[2]->id}")
            ->assertNoContent();

        $this->assertCount(5, $this->installments());
        $this->assertSoftDeleted('clinic_financial_transactions', ['id' => $rows[2]->id]);
    }

    public function test_invalid_scope_is_a_field_error(): void
    {
        $rows = $this->sixInstallments();

        $this->actingAs($this->secretary, 'clinic')
            ->deleteJson("/api/clinic/finances/transactions/{$rows[2]->id}?scope=all")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['scope']);

        $this->assertCount(6, $this->installments());
    }

    public function test_listing_brings_the_series_of_each_installment(): void
    {
        $this->sixInstallments();
        $this->createAs($this->secretary, ['description' => 'Avulso', 'date' => '2026-11-20'])->assertCreated();

        $items = collect($this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/finances/transactions?period=2026-11')
            ->assertOk()
            ->json('data'))->keyBy('description');

        $seriesId = $this->installments()->first()->series_id;
        $this->assertSame(['id' => $seriesId, 'kind' => 'installments', 'index' => 2, 'total' => 6], $items['Maca (2/6)']['series']);
        $this->assertNull($items['Avulso']['series']);
        $this->assertArrayNotHasKey('financial_series', $items['Maca (2/6)']);
    }

    public function test_another_clinic_cannot_see_edit_or_delete_the_installments(): void
    {
        $rows        = $this->sixInstallments();
        $otherClinic = Clinic::factory()->create(['timezone' => 'UTC']);
        $other       = $this->userWithRole($otherClinic, ClinicUser::ROLE_SECRETARY);

        $this->actingAs($other, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$rows[1]->id}", $this->payload([
                'description' => 'Invadido',
                'scope'       => 'following',
            ]))
            ->assertNotFound();
        $this->actingAs($other, 'clinic')
            ->deleteJson("/api/clinic/finances/transactions/{$rows[1]->id}?scope=following")
            ->assertNotFound();
        $this->assertSame([], $this->actingAs($other, 'clinic')
            ->getJson('/api/clinic/finances/transactions?period=2026-11')
            ->assertOk()
            ->json('data'));

        $this->assertCount(6, $this->installments());
        $this->assertSame(0, $this->installments()->where('description', 'Invadido')->count());
    }

    public function test_following_never_touches_a_transaction_of_another_clinic_with_the_same_series(): void
    {
        $rows        = $this->sixInstallments();
        $otherClinic = Clinic::factory()->create(['timezone' => 'UTC']);
        // Dado corrompido de propósito: lançamento de outra clínica apontando para a mesma série.
        $foreign = FinancialTransaction::factory()->create([
            'clinic_id'             => $otherClinic->id,
            'financial_category_id' => $this->categoryId(),
            'series_id'             => $rows[0]->series_id,
            'series_index'          => 99,
            'status'                => FinancialTransactionStatus::Pendente,
            'description'           => 'De outra clínica',
            'created_by_user_id'    => $this->userWithRole($otherClinic, ClinicUser::ROLE_SECRETARY)->id,
        ]);

        $this->actingAs($this->secretary, 'clinic')
            ->deleteJson("/api/clinic/finances/transactions/{$rows[3]->id}?scope=following")
            ->assertNoContent();

        $this->assertDatabaseHas('clinic_financial_transactions', ['id' => $foreign->id, 'deleted_at' => null]);
    }

    /**
     * Maca: R$ 600 em 6x de R$ 100, a partir de 15/10/2026, a 1ª recebida.
     *
     * @return \Illuminate\Support\Collection<int, FinancialTransaction>
     */
    private function sixInstallments()
    {
        $this->createAs($this->secretary, [
            'description'  => 'Maca',
            'gross_amount' => 600,
            'repeat'       => ['kind' => 'installments', 'total' => 6],
        ])->assertCreated();

        return $this->installments();
    }

    private function categoryId(): int
    {
        return (int) $this->systemCategory()->id;
    }

    private function otherIncomeCategory(): FinancialCategory
    {
        return FinancialCategory::query()
            ->whereNull('clinic_id')
            ->where('type', FinancialTransactionType::Entrada->value)
            ->where('id', '!=', $this->categoryId())
            ->firstOrFail();
    }

    private function installments()
    {
        return FinancialTransaction::query()
            ->where('clinic_id', $this->clinic->id)
            ->orderBy('date')
            ->orderBy('id')
            ->get();
    }

    private function createAs(ClinicUser $user, array $overrides = [])
    {
        return $this->actingAs($user, 'clinic')->postJson('/api/clinic/finances/transactions', $this->payload($overrides));
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'date'                  => '2026-10-15',
            'description'           => 'Pacote de sessões',
            'financial_category_id' => $this->systemCategory()->id,
            'type'                  => FinancialTransactionType::Entrada->value,
            'status'                => FinancialTransactionStatus::Recebido->value,
            'payment_method'        => PaymentMethod::CartaoCredito->value,
            'gross_amount'          => 100,
            'fee_amount'            => 0,
        ], $overrides);
    }

    private function systemCategory(FinancialTransactionType $type = FinancialTransactionType::Entrada): FinancialCategory
    {
        return FinancialCategory::query()
            ->whereNull('clinic_id')
            ->where('type', $type->value)
            ->firstOrFail();
    }

    private function userWithRole(Clinic $clinic, string $role): ClinicUser
    {
        return ClinicUser::factory()->create(['clinic_id' => $clinic->id, 'role' => $role]);
    }
}
