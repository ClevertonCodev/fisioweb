<?php

namespace Modules\ClinicFinance\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Database\Seeders\FinancialCategorySeeder;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Enums\PaymentMethod;
use Modules\ClinicFinance\Models\FinancialCategory;
use Modules\ClinicFinance\Models\FinancialSeries;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

/**
 * Recorrência (tarefa 017): editar e excluir "este e os próximos". Editar divide a
 * série no ponto escolhido (a antiga termina na ocorrência anterior e nasce uma nova
 * com os dados novos); excluir encerra a série. As pagas/recebidas ficam como estão.
 */
class FinanceRecurrenceFollowingTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    protected function setUp(): void
    {
        parent::setUp();

        // Aluguel mensal desde 10/01/2027; hoje é 05/03/2027.
        $this->travelTo(now()->setDate(2027, 3, 5)->setTime(12, 0));
        $this->seed(FinancialCategorySeeder::class);

        $this->clinic = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->admin  = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
    }

    public function test_editing_march_with_following_changes_march_onwards_and_keeps_january_and_february(): void
    {
        $this->monthlyRentSinceJanuary();
        $march = $this->occurrenceOn('2027-03-10');

        $this->editAs($this->admin, $march, ['gross_amount' => 3000, 'description' => 'Aluguel novo'], 'following')
            ->assertOk()
            ->assertJsonPath('data.id', $march->id)
            ->assertJsonPath('data.gross_amount', '3000.00')
            ->assertJsonPath('data.series.kind', 'recurrence')
            ->assertJsonPath('data.series.index', 1);

        $this->assertSame(['2500.00', '2500.00'], [
            $this->occurrenceOn('2027-01-10')->gross_amount,
            $this->occurrenceOn('2027-02-10')->gross_amount,
        ]);
        $this->assertSame('Aluguel', $this->occurrenceOn('2027-02-10')->description);

        // De março em diante: uma ocorrência por mês, todas com o valor novo, até 12 meses à frente.
        $fromMarch = $this->active()->filter(fn ($t) => $t->date->toDateString() >= '2027-03-10')->values();
        $this->assertSame(
            ['2027-03-10', '2027-04-10', '2027-05-10'],
            $fromMarch->take(3)->map(fn ($t) => $t->date->toDateString())->all(),
        );
        $this->assertSame('2028-02-10', $fromMarch->last()->date->toDateString());
        $this->assertSame(['3000.00'], $fromMarch->pluck('gross_amount')->unique()->values()->all());
        $this->assertSame(['Aluguel novo'], $fromMarch->pluck('description')->unique()->values()->all());
        $this->assertSame(1, $fromMarch->filter(fn ($t) => $t->date->toDateString() === '2027-04-10')->count());

        // A série antiga termina em fevereiro; a nova começa em março com os dados novos.
        [$old, $new] = FinancialSeries::query()->orderBy('id')->get()->all();
        $this->assertSame('2027-02-10', $old->ends_on->toDateString());
        $this->assertSame('2500.00', $old->gross_amount);
        $this->assertSame('2027-03-10', $new->anchor_date->toDateString());
        $this->assertSame('3000.00', $new->gross_amount);
        $this->assertSame('Aluguel novo', $new->description);
        $this->assertSame('monthly', $new->frequency->value);
        $this->assertNull($new->ends_on);
        $this->assertSame($new->id, $fromMarch->pluck('series_id')->unique()->sole());

        // As futuras pendentes da antiga foram para a lixeira.
        $this->assertSame(11, FinancialTransaction::onlyTrashed()->where('series_id', $old->id)->count());
    }

    public function test_a_future_occurrence_already_paid_does_not_change_nor_gets_a_duplicate(): void
    {
        $this->monthlyRentSinceJanuary();
        $june = $this->occurrenceOn('2027-06-10');
        $this->actingAs($this->admin, 'clinic')
            ->patchJson("/api/clinic/finances/transactions/{$june->id}/status", ['status' => 'pago'])
            ->assertOk();

        $this->editAs($this->admin, $this->occurrenceOn('2027-03-10'), ['gross_amount' => 3000], 'following')->assertOk();

        $paid = $this->occurrenceOn('2027-06-10');
        $this->assertSame($june->id, $paid->id);
        $this->assertSame('2500.00', $paid->gross_amount);
        $this->assertSame('pago', $paid->status->value);
        $this->assertSame('Aluguel', $paid->description);
        // Na série nova, no lugar de junho (a 4ª contando de março), sem outra ocorrência no mesmo mês.
        $new = FinancialSeries::query()->latest('id')->first();
        $this->assertSame([(int) $new->id, 4], [(int) $paid->series_id, (int) $paid->series_index]);
        $this->assertSame('3000.00', $this->occurrenceOn('2027-07-10')->gross_amount);
    }

    public function test_after_the_split_the_command_generates_in_the_new_series_and_not_in_the_old(): void
    {
        $this->monthlyRentSinceJanuary();
        $this->editAs($this->admin, $this->occurrenceOn('2027-03-10'), ['gross_amount' => 3000], 'following')->assertOk();
        [$old, $new] = FinancialSeries::query()->orderBy('id')->get()->all();
        $oldCount    = FinancialTransaction::withTrashed()->where('series_id', $old->id)->count();

        $this->travelTo(now()->addMonthsNoOverflow(2));
        $this->artisan('clinic-finance:generate-recurrences')->assertSuccessful();
        $this->artisan('clinic-finance:generate-recurrences')->assertSuccessful();

        $this->assertSame($oldCount, FinancialTransaction::withTrashed()->where('series_id', $old->id)->count());
        $generated = FinancialTransaction::query()->where('series_id', $new->id)->orderBy('series_index')->get();
        $this->assertSame(['2028-03-10', '2028-04-10'], $generated->slice(-2)->map(fn ($t) => $t->date->toDateString())->values()->all());
        $this->assertSame(['3000.00'], $generated->pluck('gross_amount')->unique()->values()->all());
        $this->assertSame(range(1, 14), $generated->pluck('series_index')->map(fn ($i) => (int) $i)->all());
        $this->assertSame(1, $this->active()->filter(fn ($t) => $t->date->toDateString() === '2028-03-10')->count());
    }

    public function test_editing_with_only_changes_just_this_occurrence_and_keeps_the_series(): void
    {
        $this->monthlyRentSinceJanuary();

        $this->editAs($this->admin, $this->occurrenceOn('2027-03-10'), ['gross_amount' => 3000], 'only')->assertOk();

        $this->assertSame('3000.00', $this->occurrenceOn('2027-03-10')->gross_amount);
        $this->assertSame('2500.00', $this->occurrenceOn('2027-04-10')->gross_amount);
        $this->assertSame(1, FinancialSeries::query()->count());
        $this->assertNull(FinancialSeries::query()->sole()->ends_on);
        $this->assertSame(0, FinancialTransaction::onlyTrashed()->count());
    }

    public function test_deleting_with_following_ends_the_series_and_the_command_generates_nothing_more(): void
    {
        $this->monthlyRentSinceJanuary();
        $june = $this->occurrenceOn('2027-06-10');

        $this->actingAs($this->admin, 'clinic')
            ->deleteJson("/api/clinic/finances/transactions/{$june->id}?scope=following")
            ->assertNoContent();

        $series = FinancialSeries::query()->sole();
        $this->assertSame('2027-05-10', $series->ends_on->toDateString());
        $this->assertSame('2027-05-10', last($this->active()->map(fn ($t) => $t->date->toDateString())->all()));
        $this->assertSoftDeleted('clinic_financial_transactions', ['id' => $june->id]);
        $this->assertSame(9, FinancialTransaction::onlyTrashed()->count());

        $this->travelTo(now()->addMonthsNoOverflow(3));
        $this->artisan('clinic-finance:generate-recurrences')->assertSuccessful();

        $this->assertSame(5, $this->active()->count());
        $this->assertSame(14, FinancialTransaction::withTrashed()->count());
    }

    public function test_an_occurrence_sent_to_the_trash_before_the_split_does_not_come_back_in_the_new_series(): void
    {
        $this->monthlyRentSinceJanuary();
        $may = $this->occurrenceOn('2027-05-10');
        $this->actingAs($this->admin, 'clinic')
            ->deleteJson("/api/clinic/finances/transactions/{$may->id}?scope=only")
            ->assertNoContent();

        $this->editAs($this->admin, $this->occurrenceOn('2027-03-10'), ['gross_amount' => 3000], 'following')->assertOk();
        $this->travelTo(now()->addMonthNoOverflow());
        $this->artisan('clinic-finance:generate-recurrences')->assertSuccessful();

        $this->assertSame(0, $this->active()->filter(fn ($t) => $t->date->toDateString() === '2027-05-10')->count());
        $this->assertSame('2027-04-10', $this->occurrenceOn('2027-04-10')->date->toDateString());
        $this->assertSame('2027-06-10', $this->occurrenceOn('2027-06-10')->date->toDateString());
    }

    public function test_editing_the_first_occurrence_with_following_moves_the_whole_rule(): void
    {
        $this->monthlyRentSinceJanuary();

        $this->editAs($this->admin, $this->occurrenceOn('2027-01-10'), ['gross_amount' => 3000], 'following')->assertOk();

        // Janeiro e fevereiro estavam pagos: passam para a nova sem mudar.
        $this->assertSame('3000.00', $this->occurrenceOn('2027-01-10')->gross_amount);
        $this->assertSame('2500.00', $this->occurrenceOn('2027-02-10')->gross_amount);
        $this->assertSame('3000.00', $this->occurrenceOn('2027-03-10')->gross_amount);
        $this->assertSame(14, $this->active()->count());
        [$old] = FinancialSeries::query()->orderBy('id')->get()->all();
        $this->assertSame(0, FinancialTransaction::query()->where('series_id', $old->id)->count());
    }

    public function test_editing_the_february_of_a_monthly_from_day_31_keeps_day_31_in_the_next_months(): void
    {
        $this->createAs($this->admin, [
            'date'   => '2027-01-31',
            'status' => FinancialTransactionStatus::Pendente->value,
            'repeat' => ['kind' => 'recurrence', 'frequency' => 'monthly'],
        ])->assertCreated();

        // Só o valor muda; a data é a que a regra deu (28/02, porque fevereiro não tem 31).
        $this->editAs($this->admin, $this->occurrenceOn('2027-02-28'), ['gross_amount' => 3000], 'following')->assertOk();

        $this->assertSame(
            ['2027-01-31', '2027-02-28', '2027-03-31', '2027-04-30', '2027-05-31'],
            array_slice($this->active()->map(fn ($t) => $t->date->toDateString())->all(), 0, 5),
        );
        $this->assertSame('3000.00', $this->occurrenceOn('2027-03-31')->gross_amount);

        // O comando segue no dia 31 também.
        $this->travelTo(now()->addMonthsNoOverflow(2));
        $this->artisan('clinic-finance:generate-recurrences')->assertSuccessful();
        $this->assertSame('2028-04-30', last($this->active()->map(fn ($t) => $t->date->toDateString())->all()));
    }

    public function test_changing_the_date_on_purpose_with_following_makes_the_new_day_the_rule(): void
    {
        $this->createAs($this->admin, [
            'date'   => '2027-01-31',
            'status' => FinancialTransactionStatus::Pendente->value,
            'repeat' => ['kind' => 'recurrence', 'frequency' => 'monthly'],
        ])->assertCreated();

        $this->editAs($this->admin, $this->occurrenceOn('2027-02-28'), ['date' => '2027-02-25'], 'following')->assertOk();

        $this->assertSame(
            ['2027-01-31', '2027-02-25', '2027-03-25', '2027-04-25'],
            array_slice($this->active()->map(fn ($t) => $t->date->toDateString())->all(), 0, 4),
        );
    }

    public function test_editing_a_yearly_from_29_february_in_a_common_year_comes_back_to_29_february_in_the_next_leap_year(): void
    {
        $this->travelTo(now()->setDate(2028, 3, 1));
        $this->createAs($this->admin, [
            'date'   => '2028-02-29',
            'status' => FinancialTransactionStatus::Pendente->value,
            'repeat' => ['kind' => 'recurrence', 'frequency' => 'yearly'],
        ])->assertCreated();

        $this->editAs($this->admin, $this->occurrenceOn('2029-02-28'), ['gross_amount' => 3000], 'following')->assertOk();

        $this->travelTo(now()->setDate(2031, 3, 5));
        $this->artisan('clinic-finance:generate-recurrences')->assertSuccessful();

        $this->assertSame(
            ['2028-02-29', '2029-02-28', '2030-02-28', '2031-02-28', '2032-02-29'],
            $this->active()->map(fn ($t) => $t->date->toDateString())->all(),
        );
    }

    public function test_changing_an_income_to_expense_with_following_takes_the_patient_off_the_next_occurrences(): void
    {
        $patient = Patient::factory()->create(['clinic_id' => $this->clinic->id]);
        $this->createAs($this->admin, [
            'type'                  => FinancialTransactionType::Entrada->value,
            'financial_category_id' => $this->incomeCategory()->id,
            'status'                => FinancialTransactionStatus::Pendente->value,
            'patient_id'            => $patient->id,
            'repeat'                => ['kind' => 'recurrence', 'frequency' => 'monthly'],
        ])->assertCreated();
        $this->assertSame([(int) $patient->id], $this->active()->pluck('patient_id')->map(fn ($id) => (int) $id)->unique()->values()->all());

        // Vira saída sem mandar o paciente: saída nunca leva paciente.
        $march = $this->occurrenceOn('2027-03-10');
        $this->actingAs($this->admin, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$march->id}", $this->payload(['date' => '2027-03-10', 'status' => 'pendente', 'scope' => 'following']))
            ->assertOk();

        $new = FinancialSeries::query()->latest('id')->first();
        $this->assertSame('saida', $new->type->value);
        $this->assertNull($new->patient_id);

        $this->travelTo(now()->addMonthNoOverflow());
        $this->artisan('clinic-finance:generate-recurrences')->assertSuccessful();

        $fromMarch = $this->active()->filter(fn ($t) => $t->date->toDateString() >= '2027-03-10');
        $this->assertSame(['saida'], $fromMarch->map(fn ($t) => $t->type->value)->unique()->values()->all());
        $this->assertSame([null], $fromMarch->pluck('patient_id')->unique()->values()->all());
        $this->assertSame([null], $fromMarch->pluck('appointment_id')->unique()->values()->all());
        $this->assertSame((int) $patient->id, (int) $this->occurrenceOn('2027-02-10')->patient_id);
    }

    public function test_other_clinic_gets_404_and_changes_nothing_in_the_series(): void
    {
        $this->monthlyRentSinceJanuary();
        $march = $this->occurrenceOn('2027-03-10');

        $otherClinic = Clinic::factory()->create(['timezone' => 'UTC']);
        $intruder    = ClinicUser::factory()->create(['clinic_id' => $otherClinic->id, 'role' => ClinicUser::ROLE_ADMIN]);

        $this->editAs($intruder, $march, ['gross_amount' => 1], 'following')->assertNotFound();
        $this->actingAs($intruder, 'clinic')
            ->deleteJson("/api/clinic/finances/transactions/{$march->id}?scope=following")
            ->assertNotFound();
        $this->actingAs($intruder, 'clinic')
            ->getJson('/api/clinic/finances/transactions?from=2027-03-01&to=2027-03-31')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $series = FinancialSeries::query()->sole();
        $this->assertNull($series->ends_on);
        $this->assertSame(14, $this->active()->count());
        $this->assertSame('2500.00', $march->fresh()->gross_amount);
        $this->assertSame(0, FinancialTransaction::onlyTrashed()->count());
        $this->assertCount(0, $this->active($otherClinic));
    }

    public function test_secretary_splits_the_series_and_physiotherapist_gets_403(): void
    {
        $this->monthlyRentSinceJanuary();
        $secretary = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $physio    = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $march     = $this->occurrenceOn('2027-03-10');

        $this->editAs($physio, $march, ['gross_amount' => 1], 'following')->assertForbidden();
        $this->actingAs($physio, 'clinic')
            ->deleteJson("/api/clinic/finances/transactions/{$march->id}?scope=following")
            ->assertForbidden();
        $this->assertSame(1, FinancialSeries::query()->count());

        $this->editAs($secretary, $march, ['gross_amount' => 3000], 'following')->assertOk();
        $this->assertSame(2, FinancialSeries::query()->count());
    }

    public function test_editing_only_the_value_of_an_occurrence_moved_with_only_keeps_the_rule_day(): void
    {
        $this->monthlyRentSinceJanuary();
        $this->editAs($this->admin, $this->occurrenceOn('2027-03-10'), ['date' => '2027-03-20'], 'only')->assertOk();

        // Só o valor muda: a data enviada é a gravada (20/03), não a da regra, e a regra fica no dia 10.
        $this->editAs($this->admin, $this->occurrenceOn('2027-03-20'), ['gross_amount' => 3000], 'following')->assertOk();

        $fromMarch = $this->active()->filter(fn ($t) => $t->date->toDateString() >= '2027-03-01')->values();
        $this->assertSame(
            ['2027-03-20', '2027-04-10', '2027-05-10', '2027-06-10'],
            $fromMarch->take(4)->map(fn ($t) => $t->date->toDateString())->all(),
        );
        $this->assertSame(['3000.00'], $fromMarch->pluck('gross_amount')->unique()->values()->all());

        $new = FinancialSeries::query()->latest('id')->first();
        $this->assertSame([10, '2027-03-10'], [(int) $new->anchor_day, $new->anchor_date->toDateString()]);

        // O comando também segue no dia 10.
        $this->travelTo(now()->addMonthsNoOverflow(2));
        $this->artisan('clinic-finance:generate-recurrences')->assertSuccessful();
        $this->assertSame('2028-04-10', last($this->active()->map(fn ($t) => $t->date->toDateString())->all()));
    }

    public function test_editing_only_the_value_of_a_paid_occurrence_carried_by_an_earlier_split_follows_the_current_rule(): void
    {
        $this->createAs($this->admin, [
            'date'   => '2027-01-31',
            'status' => FinancialTransactionStatus::Pendente->value,
            'repeat' => ['kind' => 'recurrence', 'frequency' => 'monthly'],
        ])->assertCreated();
        $this->actingAs($this->admin, 'clinic')
            ->patchJson("/api/clinic/finances/transactions/{$this->occurrenceOn('2027-06-30')->id}/status", ['status' => 'pago'])
            ->assertOk();

        // Março muda para o dia 10 dali em diante; junho, pago, vai para a série nova ainda no dia 30.
        $this->editAs($this->admin, $this->occurrenceOn('2027-03-31'), ['date' => '2027-03-10'], 'following')->assertOk();
        $this->assertSame(
            ['2027-03-10', '2027-04-10', '2027-05-10', '2027-06-30', '2027-07-10'],
            $this->datesFrom('2027-03-01', 5),
        );

        // Só o valor de junho muda: as próximas seguem a regra vigente (dia 10), não o dia 30 de junho.
        $this->editAs($this->admin, $this->occurrenceOn('2027-06-30'), ['gross_amount' => 3000], 'following')->assertOk();

        $this->assertSame(['2027-06-30', '2027-07-10', '2027-08-10', '2027-09-10'], $this->datesFrom('2027-06-01', 4));
        $this->assertSame('3000.00', $this->occurrenceOn('2027-07-10')->gross_amount);
        $this->assertSame(10, (int) FinancialSeries::query()->latest('id')->first()->anchor_day);
    }

    public function test_weekly_editing_only_the_value_of_an_occurrence_moved_with_only_keeps_the_weekday(): void
    {
        // 01/03/2027 é segunda-feira.
        $this->createAs($this->admin, [
            'date'   => '2027-03-01',
            'status' => FinancialTransactionStatus::Pendente->value,
            'repeat' => ['kind' => 'recurrence', 'frequency' => 'weekly'],
        ])->assertCreated();
        $this->editAs($this->admin, $this->occurrenceOn('2027-03-15'), ['date' => '2027-03-17'], 'only')->assertOk();

        $this->editAs($this->admin, $this->occurrenceOn('2027-03-17'), ['gross_amount' => 3000], 'following')->assertOk();

        $this->assertSame(['2027-03-17', '2027-03-22', '2027-03-29', '2027-04-05'], $this->datesFrom('2027-03-15', 4));
        $after = $this->active()->filter(fn ($t) => $t->date->toDateString() > '2027-03-17');
        $this->assertSame([1], $after->map(fn ($t) => $t->date->dayOfWeek)->unique()->values()->all());
        $this->assertSame('2027-03-15', FinancialSeries::query()->latest('id')->first()->anchor_date->toDateString());
    }

    public function test_moving_the_date_past_the_end_with_following_keeps_the_new_series_end_not_before_its_start(): void
    {
        $this->monthlyRentSinceJanuary(['ends_on' => '2027-06-10']);

        $this->editAs($this->admin, $this->occurrenceOn('2027-05-10'), ['date' => '2027-07-15'], 'following')->assertOk();

        // A nova termina no maior entre o fim antigo e a data nova: nunca antes da própria 1ª.
        $new = FinancialSeries::query()->latest('id')->first();
        $this->assertSame(
            ['2027-07-15', '2027-07-15'],
            [$new->anchor_date->toDateString(), $new->ends_on->toDateString()],
        );
        $this->assertNull($new->next_occurrence_on);
        $this->assertSame(
            ['2027-01-10', '2027-02-10', '2027-03-10', '2027-04-10', '2027-07-15'],
            $this->active()->map(fn ($t) => $t->date->toDateString())->all(),
        );
    }

    public function test_deleting_and_splitting_lock_the_series_before_the_occurrences(): void
    {
        // A mesma ordem de trava nos dois caminhos: duas requisições ao mesmo tempo não se travam (deadlock).
        $this->monthlyRentSinceJanuary();

        $split = $this->queriesDuring(fn () => $this->editAs($this->admin, $this->occurrenceOn('2027-03-10'), ['gross_amount' => 3000], 'following')->assertOk());
        $this->assertSeriesLockedBeforeOccurrences($split);

        $delete = $this->queriesDuring(fn () => $this->actingAs($this->admin, 'clinic')
            ->deleteJson("/api/clinic/finances/transactions/{$this->occurrenceOn('2027-06-10')->id}?scope=following")
            ->assertNoContent());
        $this->assertSeriesLockedBeforeOccurrences($delete);
    }

    /** @return list<string> */
    private function queriesDuring(callable $action): array
    {
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = $query->sql;
        });
        $action();

        return $queries;
    }

    /** @param list<string> $queries */
    private function assertSeriesLockedBeforeOccurrences(array $queries): void
    {
        $seriesLock = $this->firstQueryIndex($queries, fn ($sql) => str_contains($sql, 'from "clinic_financial_series" where "kind" = ?'));
        $later      = $this->firstQueryIndex($queries, fn ($sql) => str_contains($sql, 'from "clinic_financial_transactions"') && str_contains($sql, '"series_index" > ?'));

        $this->assertNotNull($seriesLock, 'A série não foi travada.');
        $this->assertNotNull($later, 'As próximas ocorrências não foram buscadas.');
        $this->assertLessThan($later, $seriesLock, 'As ocorrências foram buscadas antes de travar a série.');
    }

    /** @param list<string> $queries */
    private function firstQueryIndex(array $queries, callable $matches): ?int
    {
        foreach ($queries as $index => $sql) {
            if ($matches($sql)) {
                return $index;
            }
        }

        return null;
    }

    /** @return list<string> */
    private function datesFrom(string $from, int $take): array
    {
        return $this->active()
            ->filter(fn ($t) => $t->date->toDateString() >= $from)
            ->take($take)
            ->map(fn ($t) => $t->date->toDateString())
            ->values()
            ->all();
    }

    private function monthlyRentSinceJanuary(array $repeat = []): void
    {
        $this->createAs($this->admin, [
            'date'   => '2027-01-10',
            'repeat' => ['kind' => 'recurrence', 'frequency' => 'monthly', ...$repeat],
        ])->assertCreated();

        // Fevereiro também pago.
        $this->actingAs($this->admin, 'clinic')
            ->patchJson("/api/clinic/finances/transactions/{$this->occurrenceOn('2027-02-10')->id}/status", ['status' => 'pago'])
            ->assertOk();
    }

    private function occurrenceOn(string $date, ?Clinic $clinic = null): FinancialTransaction
    {
        return $this->active($clinic)->filter(fn ($t) => $t->date->toDateString() === $date)->sole();
    }

    private function active(?Clinic $clinic = null)
    {
        return FinancialTransaction::query()
            ->where('clinic_id', ($clinic ?? $this->clinic)->id)
            ->orderBy('date')
            ->orderBy('id')
            ->get();
    }

    private function editAs(ClinicUser $user, FinancialTransaction $transaction, array $changes, string $scope)
    {
        return $this->actingAs($user, 'clinic')->putJson(
            "/api/clinic/finances/transactions/{$transaction->id}",
            $this->payload([
                'date'   => $transaction->date->toDateString(),
                'status' => $transaction->status->value,
                ...$changes,
                'scope'  => $scope,
            ]),
        );
    }

    private function createAs(ClinicUser $user, array $overrides = [])
    {
        return $this->actingAs($user, 'clinic')->postJson('/api/clinic/finances/transactions', $this->payload($overrides));
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'date'                  => '2027-01-10',
            'description'           => 'Aluguel',
            'financial_category_id' => $this->expenseCategory()->id,
            'type'                  => FinancialTransactionType::Saida->value,
            'status'                => FinancialTransactionStatus::Pago->value,
            'payment_method'        => PaymentMethod::Boleto->value,
            'gross_amount'          => 2500,
            'fee_amount'            => 0,
        ], $overrides);
    }

    private function incomeCategory(): FinancialCategory
    {
        return FinancialCategory::query()
            ->whereNull('clinic_id')
            ->where('type', FinancialTransactionType::Entrada->value)
            ->firstOrFail();
    }

    private function expenseCategory(): FinancialCategory
    {
        return FinancialCategory::query()
            ->whereNull('clinic_id')
            ->where('type', FinancialTransactionType::Saida->value)
            ->firstOrFail();
    }
}
