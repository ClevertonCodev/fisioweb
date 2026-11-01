<?php

namespace Modules\ClinicFinance\Tests\Feature;

use Carbon\CarbonImmutable;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Contracts\FinancialSeriesRepositoryInterface;
use Modules\ClinicFinance\Database\Seeders\FinancialCategorySeeder;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Enums\PaymentMethod;
use Modules\ClinicFinance\Events\FinancialTransactionRecorded;
use Modules\ClinicFinance\Models\FinancialCategory;
use Modules\ClinicFinance\Models\FinancialSeries;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Modules\ClinicFinance\Support\RecurrenceSchedule;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Recorrência (tarefa 016): o lançamento que se repete toda semana, todo mês ou
 * todo ano, gerado até 12 meses à frente de hoje e, depois, pelo comando diário.
 */
class FinanceRecurrenceTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(now()->setDate(2027, 1, 20)->setTime(12, 0));
        $this->seed(FinancialCategorySeeder::class);

        $this->clinic = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->admin  = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
    }

    public function test_monthly_from_day_31_falls_on_the_last_day_of_short_months(): void
    {
        $this->createAs($this->admin, [
            'date'   => '2027-01-31',
            'repeat' => ['kind' => 'recurrence', 'frequency' => 'monthly', 'ends_on' => null],
        ])->assertCreated();

        $this->assertSame(
            ['2027-01-31', '2027-02-28', '2027-03-31', '2027-04-30'],
            array_slice($this->dates(), 0, 4),
        );
    }

    public function test_monthly_from_31_january_of_a_leap_year_falls_on_29_february(): void
    {
        $this->travelTo(now()->setDate(2028, 1, 20));

        $this->createAs($this->admin, [
            'date'   => '2028-01-31',
            'repeat' => ['kind' => 'recurrence', 'frequency' => 'monthly'],
        ])->assertCreated();

        $this->assertSame(['2028-01-31', '2028-02-29', '2028-03-31'], array_slice($this->dates(), 0, 3));
    }

    public function test_yearly_from_29_february_falls_on_28_february_in_common_years(): void
    {
        $this->travelTo(now()->setDate(2028, 3, 1));

        $this->createAs($this->admin, [
            'date'   => '2028-02-29',
            'repeat' => ['kind' => 'recurrence', 'frequency' => 'yearly', 'ends_on' => null],
        ])->assertCreated()->assertJsonPath('meta.createdCount', 2);

        $this->assertSame(['2028-02-29', '2029-02-28'], $this->dates());
    }

    public function test_weekly_creates_52_or_53_occurrences_in_12_months_seven_days_apart(): void
    {
        $this->createAs($this->admin, [
            'date'   => '2027-01-20',
            'repeat' => ['kind' => 'recurrence', 'frequency' => 'weekly'],
        ])->assertCreated();

        $dates = $this->dates();
        $this->assertContains(count($dates), [52, 53]);
        $this->assertSame(['2027-01-20', '2027-01-27', '2027-02-03'], array_slice($dates, 0, 3));
        $this->assertLessThan('2028-01-20', end($dates));
    }

    public function test_monthly_creates_twelve_months_ahead_of_today(): void
    {
        $this->createAs($this->admin, [
            'date'   => '2027-01-20',
            'repeat' => ['kind' => 'recurrence', 'frequency' => 'monthly'],
        ])->assertCreated()->assertJsonPath('meta.createdCount', 12);

        $dates = $this->dates();
        $this->assertSame('2027-01-20', $dates[0]);
        $this->assertSame('2027-12-20', end($dates));
    }

    public function test_first_keeps_the_chosen_date_and_status_the_next_are_pending_with_the_same_data(): void
    {
        $response = $this->createAs($this->admin, [
            'date'           => '2027-01-20',
            'description'    => 'Aluguel da sala',
            'status'         => FinancialTransactionStatus::Pago->value,
            'payment_method' => PaymentMethod::Pix->value,
            'gross_amount'   => 2500,
            'fee_amount'     => 2.5,
            'notes'          => 'Contrato de 2027',
            'repeat'         => ['kind' => 'recurrence', 'frequency' => 'monthly'],
        ])->assertCreated();

        $rows = $this->occurrences();
        $this->assertSame('pago', $rows->first()->status->value);
        $this->assertSame(['pendente'], $rows->slice(1)->map(fn ($t) => $t->status->value)->unique()->values()->all());
        foreach ($rows as $row) {
            $this->assertSame('Aluguel da sala', $row->description);
            $this->assertSame('2500.00', $row->gross_amount);
            $this->assertSame('2.50', $row->fee_amount);
            $this->assertSame('2497.50', $row->net_amount);
            $this->assertSame('pix', $row->payment_method->value);
            $this->assertSame('saida', $row->type->value);
            $this->assertSame((int) $this->expenseCategory()->id, (int) $row->financial_category_id);
            $this->assertSame('Contrato de 2027', $row->notes);
            $this->assertSame((int) $this->admin->id, (int) $row->created_by_user_id);
        }
        $this->assertSame(range(1, 12), $rows->pluck('series_index')->map(fn ($i) => (int) $i)->all());

        $response
            ->assertJsonPath('data.id', $rows->first()->id)
            ->assertJsonPath('data.series.kind', 'recurrence')
            ->assertJsonPath('data.series.index', 1)
            ->assertJsonPath('data.series.total', null);

        $series = FinancialSeries::query()->sole();
        $this->assertSame((int) $this->clinic->id, (int) $series->clinic_id);
        $this->assertSame('recurrence', $series->kind->value);
        $this->assertSame('monthly', $series->frequency->value);
        $this->assertNull($series->ends_on);
        $this->assertSame('2027-12-20', $series->generated_until->toDateString());
        $this->assertSame('2500.00', $series->gross_amount);
    }

    public function test_ends_on_stops_the_occurrences_on_creation(): void
    {
        $this->createAs($this->admin, [
            'date'   => '2027-01-31',
            'repeat' => ['kind' => 'recurrence', 'frequency' => 'monthly', 'ends_on' => '2027-03-31'],
        ])->assertCreated()->assertJsonPath('meta.createdCount', 3);

        $this->assertSame(['2027-01-31', '2027-02-28', '2027-03-31'], $this->dates());
    }

    public function test_yearly_from_today_creates_only_the_first_and_the_command_brings_the_next_in_a_year(): void
    {
        // A 2ª ocorrência cai bem no horizonte de 12 meses: só a 1ª nasce agora.
        $this->createAs($this->admin, [
            'date'   => '2027-01-20',
            'repeat' => ['kind' => 'recurrence', 'frequency' => 'yearly'],
        ])->assertCreated()->assertJsonPath('meta.createdCount', 1);

        $this->assertSame(['2027-01-20'], $this->dates());
        $this->assertSame('2028-01-20', FinancialSeries::query()->sole()->next_occurrence_on->toDateString());

        $this->travelTo(now()->addDay());
        $this->artisan('clinic-finance:generate-recurrences')->assertSuccessful();

        $this->assertSame(['2027-01-20', '2028-01-20'], $this->dates());
    }

    public function test_ends_on_before_the_second_occurrence_creates_only_the_first(): void
    {
        $this->createAs($this->admin, [
            'date'   => '2027-01-20',
            'repeat' => ['kind' => 'recurrence', 'frequency' => 'monthly', 'ends_on' => '2027-02-10'],
        ])->assertCreated()->assertJsonPath('meta.createdCount', 1);

        $this->assertSame(['2027-01-20'], $this->dates());
        $this->assertNull(FinancialSeries::query()->sole()->next_occurrence_on);
    }

    #[DataProvider('invalidRepeats')]
    public function test_invalid_recurrence_is_a_field_error_and_creates_nothing(array $overrides, string $field): void
    {
        $this->createAs($this->admin, $overrides)
            ->assertUnprocessable()
            ->assertJsonValidationErrors([$field]);

        $this->assertDatabaseCount('clinic_financial_transactions', 0);
        $this->assertDatabaseCount('clinic_financial_series', 0);
    }

    public static function invalidRepeats(): array
    {
        return [
            'sem frequência'         => [['repeat' => ['kind' => 'recurrence']], 'repeat.frequency'],
            'frequência inválida'    => [['repeat' => ['kind' => 'recurrence', 'frequency' => 'daily']], 'repeat.frequency'],
            'fim antes da 1ª'        => [['date' => '2027-01-20', 'repeat' => ['kind' => 'recurrence', 'frequency' => 'monthly', 'ends_on' => '2027-01-19']], 'repeat.ends_on'],
            'fim não é data'         => [['repeat' => ['kind' => 'recurrence', 'frequency' => 'monthly', 'ends_on' => 'nunca']], 'repeat.ends_on'],
            'mais de 12 meses atrás' => [['date' => '2026-01-19', 'repeat' => ['kind' => 'recurrence', 'frequency' => 'weekly']], 'date'],
        ];
    }

    public function test_command_twice_does_not_duplicate_and_after_a_month_generates_the_next(): void
    {
        $this->monthlyRent();
        $this->assertCount(12, $this->occurrences());

        $this->artisan('clinic-finance:generate-recurrences')->assertSuccessful();
        $this->artisan('clinic-finance:generate-recurrences')->assertSuccessful();
        $this->assertCount(12, $this->occurrences());

        $this->travelTo(now()->addMonthNoOverflow());
        $this->artisan('clinic-finance:generate-recurrences')->assertSuccessful();
        $this->artisan('clinic-finance:generate-recurrences')->assertSuccessful();

        $rows = $this->occurrences();
        $this->assertCount(13, $rows);
        $this->assertSame('2028-01-20', $rows->last()->date->toDateString());
        $this->assertSame(13, (int) $rows->last()->series_index);
        $this->assertSame('pendente', $rows->last()->status->value);
        $this->assertSame('2028-01-20', FinancialSeries::query()->sole()->generated_until->toDateString());
    }

    public function test_the_command_only_picks_the_series_that_have_an_occurrence_to_create(): void
    {
        $repository = app(FinancialSeriesRepositoryInterface::class);
        $this->monthlyRent();
        $this->monthlyRent(['date' => '2027-01-25', 'ends_on' => '2027-06-25']);
        [$open, $ended] = FinancialSeries::query()->orderBy('id')->pluck('id')->map(fn ($id) => (int) $id)->all();

        // Logo depois de criar, as duas já vão até antes do horizonte: nada a travar hoje.
        $this->assertSame([], $repository->recurrenceIdsToGenerate(RecurrenceSchedule::horizonFrom(CarbonImmutable::today()))->all());

        // Um mês depois, só a sem fim tem ocorrência nova (a outra acabou em junho).
        $this->travelTo(now()->addMonthNoOverflow());
        $this->assertSame([$open], $repository->recurrenceIdsToGenerate(RecurrenceSchedule::horizonFrom(CarbonImmutable::today()))->all());

        $this->artisan('clinic-finance:generate-recurrences')->assertSuccessful();
        $this->assertSame([], $repository->recurrenceIdsToGenerate(RecurrenceSchedule::horizonFrom(CarbonImmutable::today()))->all());
        $this->assertNotContains($ended, $repository->recurrenceIdsToGenerate(RecurrenceSchedule::horizonFrom(CarbonImmutable::today()->addYears(3)))->all());
    }

    public function test_the_same_position_of_a_series_cannot_be_inserted_twice(): void
    {
        $this->monthlyRent();
        $last = $this->occurrences()->last();

        $this->expectException(UniqueConstraintViolationException::class);
        $last->replicate()->fill(['date' => '2027-12-21'])->save();
    }

    public function test_the_command_is_scheduled_daily(): void
    {
        $event = collect(app(Schedule::class)->events())
            ->filter(fn ($e) => str_contains((string) $e->command, 'clinic-finance:generate-recurrences'))
            ->sole();

        $this->assertSame('0 3 * * *', $event->expression);
        $this->assertTrue($event->withoutOverlapping);
        $this->assertTrue($event->onOneServer);
    }

    public function test_command_respects_ends_on(): void
    {
        $this->monthlyRent(['ends_on' => '2028-02-20']);
        $this->assertCount(12, $this->occurrences());

        $this->travelTo(now()->setDate(2027, 6, 1));
        $this->artisan('clinic-finance:generate-recurrences')->assertSuccessful();

        $this->assertSame('2028-02-20', last($this->dates()));
        $this->assertCount(14, $this->occurrences());
    }

    public function test_command_does_not_bring_back_an_occurrence_sent_to_the_trash(): void
    {
        $this->monthlyRent();
        $last = $this->occurrences()->last();
        $this->actingAs($this->admin, 'clinic')
            ->deleteJson("/api/clinic/finances/transactions/{$last->id}")
            ->assertSuccessful();

        $this->artisan('clinic-finance:generate-recurrences')->assertSuccessful();

        $this->assertCount(11, $this->occurrences());
        $this->assertSoftDeleted('clinic_financial_transactions', ['id' => $last->id]);
    }

    public function test_command_creates_each_occurrence_with_the_clinic_of_its_series_and_fires_the_event(): void
    {
        $otherClinic = Clinic::factory()->create(['timezone' => 'UTC']);
        $otherAdmin  = ClinicUser::factory()->create(['clinic_id' => $otherClinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $this->monthlyRent();
        $this->createAs($otherAdmin, [
            'date'   => '2027-01-25',
            'repeat' => ['kind' => 'recurrence', 'frequency' => 'monthly'],
        ])->assertCreated();
        Auth::guard('clinic')->logout();

        Event::fake([FinancialTransactionRecorded::class]);
        $this->travelTo(now()->addMonthsNoOverflow(2));
        $this->artisan('clinic-finance:generate-recurrences')->assertSuccessful();

        $this->assertCount(14, $this->occurrences());
        $this->assertCount(14, $this->occurrences($otherClinic));
        foreach (FinancialSeries::query()->get() as $series) {
            $generated = FinancialTransaction::query()->where('series_id', $series->id)->where('series_index', '>', 12)->get();
            $this->assertCount(2, $generated);
            foreach ($generated as $row) {
                $this->assertSame((int) $series->clinic_id, (int) $row->clinic_id);
                $this->assertSame((int) $series->created_by_user_id, (int) $row->created_by_user_id);
            }
        }
        Event::assertDispatchedTimes(FinancialTransactionRecorded::class, 4);
        Event::assertDispatched(
            FinancialTransactionRecorded::class,
            fn (FinancialTransactionRecorded $e) => $e->clinicId === (int) $otherClinic->id && $e->date === '2028-02-25',
        );
    }

    public function test_a_series_that_fails_does_not_stop_the_others(): void
    {
        $this->monthlyRent();
        $broken = FinancialSeries::query()->sole();
        // Categoria desligada depois: a série dela falha, as outras seguem.
        $category = FinancialCategory::factory()->create([
            'clinic_id' => $this->clinic->id,
            'type'      => FinancialTransactionType::Saida->value,
            'origin'    => 'custom',
        ]);
        $this->monthlyRent(['date' => '2027-01-21'], ['financial_category_id' => $category->id]);
        $category->update(['active' => false]);

        $this->travelTo(now()->addMonthNoOverflow());
        $this->artisan('clinic-finance:generate-recurrences')->assertFailed();

        $this->assertSame(13, FinancialTransaction::query()->where('series_id', $broken->id)->count());
    }

    public function test_other_clinic_does_not_see_or_change_the_occurrences_nor_uses_its_category(): void
    {
        $category = FinancialCategory::factory()->create([
            'clinic_id' => $this->clinic->id,
            'type'      => FinancialTransactionType::Saida->value,
            'origin'    => 'custom',
        ]);
        $this->monthlyRent([], ['financial_category_id' => $category->id]);
        $future = $this->occurrences()->last();

        $otherClinic = Clinic::factory()->create(['timezone' => 'UTC']);
        $intruder    = ClinicUser::factory()->create(['clinic_id' => $otherClinic->id, 'role' => ClinicUser::ROLE_ADMIN]);

        $list = '/api/clinic/finances/transactions?from=2027-12-01&to=2027-12-31';
        $this->actingAs($this->admin, 'clinic')->getJson($list)->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.series.kind', 'recurrence');
        $this->actingAs($intruder, 'clinic')->getJson($list)->assertOk()->assertJsonCount(0, 'data');
        $this->actingAs($intruder, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$future->id}", $this->payload(['scope' => 'following']))
            ->assertNotFound();
        $this->actingAs($intruder, 'clinic')
            ->deleteJson("/api/clinic/finances/transactions/{$future->id}?scope=following")
            ->assertNotFound();
        // A categoria de A não serve para uma recorrência de B.
        $this->createAs($intruder, [
            'financial_category_id' => $category->id,
            'repeat'                => ['kind' => 'recurrence', 'frequency' => 'monthly'],
        ])->assertUnprocessable();

        $this->assertCount(12, $this->occurrences());
        $this->assertSame('pendente', $future->fresh()->status->value);
        $this->assertSame(1, FinancialSeries::query()->count());
        $this->assertCount(0, $this->occurrences($otherClinic));
    }

    public function test_secretary_creates_a_recurrence_and_physiotherapist_gets_403(): void
    {
        $secretary = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $physio    = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $repeat    = ['repeat' => ['kind' => 'recurrence', 'frequency' => 'weekly', 'ends_on' => '2027-02-10']];

        $this->createAs($physio, $repeat)->assertForbidden();
        $this->assertDatabaseCount('clinic_financial_series', 0);

        $this->createAs($secretary, $repeat)->assertCreated()->assertJsonPath('meta.createdCount', 4);
    }

    private function monthlyRent(array $repeat = [], array $overrides = []): void
    {
        $this->createAs($this->admin, [
            'date'   => $repeat['date'] ?? '2027-01-20',
            'repeat' => ['kind' => 'recurrence', 'frequency' => 'monthly', ...collect($repeat)->except('date')->all()],
            ...$overrides,
        ])->assertCreated();
    }

    /** @return list<string> */
    private function dates(?Clinic $clinic = null): array
    {
        return $this->occurrences($clinic)->map(fn ($t) => $t->date->toDateString())->all();
    }

    private function occurrences(?Clinic $clinic = null)
    {
        return FinancialTransaction::query()
            ->where('clinic_id', ($clinic ?? $this->clinic)->id)
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
            'date'                  => '2027-01-20',
            'description'           => 'Aluguel',
            'financial_category_id' => $this->expenseCategory()->id,
            'type'                  => FinancialTransactionType::Saida->value,
            'status'                => FinancialTransactionStatus::Pago->value,
            'payment_method'        => PaymentMethod::Boleto->value,
            'gross_amount'          => 2500,
            'fee_amount'            => 0,
        ], $overrides);
    }

    private function expenseCategory(): FinancialCategory
    {
        return FinancialCategory::query()
            ->whereNull('clinic_id')
            ->where('type', FinancialTransactionType::Saida->value)
            ->firstOrFail();
    }
}
