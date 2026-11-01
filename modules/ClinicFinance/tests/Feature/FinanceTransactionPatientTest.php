<?php

namespace Modules\ClinicFinance\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Contracts\TransactionPeopleServiceInterface;
use Modules\ClinicFinance\Database\Seeders\FinancialCategorySeeder;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Enums\PaymentMethod;
use Modules\ClinicFinance\Models\FinancialCategory;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

/**
 * Tarefa 013: a entrada pode dizer quem pagou (o paciente) e, se quiser, qual atendimento.
 * Finanças guarda só os ids; nome e posse vêm dos contratos públicos de Patient e ClinicScheduling.
 */
class FinanceTransactionPatientTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $secretary;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(now()->setDate(2026, 10, 15)->setTime(12, 0));
        $this->seed(FinancialCategorySeeder::class);

        $this->clinic    = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->secretary = $this->userWithRole($this->clinic, ClinicUser::ROLE_SECRETARY);
        $this->patient   = Patient::factory()->create(['clinic_id' => $this->clinic->id, 'name' => 'Maria Souza']);
    }

    public function test_income_with_patient_and_appointment_shows_both_in_the_listing(): void
    {
        $appointment = $this->appointment($this->clinic, $this->patient, '2026-10-15 09:00:00');

        $this->createAs($this->secretary, [
            'patient_id'     => $this->patient->id,
            'appointment_id' => $appointment->id,
        ])->assertCreated()->assertJsonPath('data.patient.name', 'Maria Souza');

        $item = $this->day($this->secretary)[0];

        $this->assertSame(['id' => $this->patient->id, 'name' => 'Maria Souza'], $item['patient']);
        $this->assertSame($appointment->id, $item['appointment']['id']);
        $this->assertStringStartsWith('2026-10-15T09:00:00', $item['appointment']['starts_at']);
    }

    public function test_patient_of_another_clinic_is_refused_on_create_and_on_edit(): void
    {
        $foreign = Patient::factory()->create(['clinic_id' => Clinic::factory()->create()->id]);
        $id      = $this->createAs($this->secretary)->assertCreated()->json('data.id');

        $this->createAs($this->secretary, ['patient_id' => $foreign->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['patient_id']);
        $this->putAs($this->secretary, $id, ['patient_id' => $foreign->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['patient_id']);

        $this->assertDatabaseCount('clinic_financial_transactions', 1);
        $this->assertDatabaseHas('clinic_financial_transactions', ['id' => $id, 'patient_id' => null]);
    }

    public function test_appointment_of_another_patient_or_another_clinic_is_refused(): void
    {
        $otherClinic   = Clinic::factory()->create(['timezone' => 'UTC']);
        $otherPatient  = Patient::factory()->create(['clinic_id' => $this->clinic->id]);
        $ofOtherPerson = $this->appointment($this->clinic, $otherPatient, '2026-10-15 10:00:00');
        // Mesmo paciente na agenda, mas o atendimento é de outra clínica.
        $ofOtherClinic = $this->appointment($otherClinic, $this->patient, '2026-10-15 11:00:00');

        foreach ([$ofOtherPerson, $ofOtherClinic] as $appointment) {
            $this->createAs($this->secretary, [
                'patient_id'     => $this->patient->id,
                'appointment_id' => $appointment->id,
            ])->assertUnprocessable()->assertJsonValidationErrors(['appointment_id']);
        }

        $this->createAs($this->secretary, ['appointment_id' => $ofOtherPerson->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['appointment_id']);

        $this->assertDatabaseCount('clinic_financial_transactions', 0);
    }

    public function test_patient_on_an_expense_is_refused_and_turning_income_into_expense_clears_it(): void
    {
        $expense = [
            'type'                  => FinancialTransactionType::Saida->value,
            'status'                => FinancialTransactionStatus::Pago->value,
            'financial_category_id' => $this->systemCategory(FinancialTransactionType::Saida)->id,
        ];

        $this->createAs($this->secretary, [...$expense, 'patient_id' => $this->patient->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['patient_id']);
        $this->assertDatabaseCount('clinic_financial_transactions', 0);

        $appointment = $this->appointment($this->clinic, $this->patient, '2026-10-15 09:00:00');
        $id          = $this->createAs($this->secretary, [
            'patient_id'     => $this->patient->id,
            'appointment_id' => $appointment->id,
        ])->assertCreated()->json('data.id');

        $this->putAs($this->secretary, $id, $expense)->assertOk();

        $this->assertDatabaseHas('clinic_financial_transactions', ['id' => $id, 'patient_id' => null, 'appointment_id' => null]);
    }

    public function test_search_finds_the_transaction_by_patient_name_ignoring_case(): void
    {
        // O LIKE do Postgres diferencia maiúscula; o PRAGMA faz o sqlite dos testes igual.
        DB::statement('PRAGMA case_sensitive_like = ON');

        try {
            $paid = $this->createAs($this->secretary, ['patient_id' => $this->patient->id, 'description' => 'Pacote', 'date' => '2025-03-10'])
                ->assertCreated()->json('data.id');
            $this->createAs($this->secretary, ['description' => 'Avulso'])->assertCreated();

            // Paciente com o mesmo nome em outra clínica não traz o lançamento de lá.
            $other      = Clinic::factory()->create(['timezone' => 'UTC']);
            $otherAdmin = $this->userWithRole($other, ClinicUser::ROLE_ADMIN);
            $twin       = Patient::factory()->create(['clinic_id' => $other->id, 'name' => 'Maria Souza']);
            $theirs     = $this->createAs($otherAdmin, ['patient_id' => $twin->id, 'description' => 'Pacote'])->assertCreated()->json('data.id');

            foreach (['maria', 'SOUZA'] as $term) {
                $found = $this->actingAs($this->secretary, 'clinic')
                    ->getJson('/api/clinic/finances/transactions?q=' . urlencode($term))
                    ->assertOk()
                    ->json('data');
                $this->assertSame([$paid], array_column($found, 'id'), "busca por {$term}");
                $this->assertSame('Maria Souza', $found[0]['patient']['name']);
            }

            $this->assertSame([$theirs], array_column($this->actingAs($otherAdmin, 'clinic')
                ->getJson('/api/clinic/finances/transactions?q=maria')->json('data'), 'id'));
        } finally {
            DB::statement('PRAGMA case_sensitive_like = OFF');
        }
    }

    public function test_patient_ids_sent_by_the_client_do_not_widen_the_search(): void
    {
        $this->createAs($this->secretary, ['patient_id' => $this->patient->id, 'description' => 'Pacote'])->assertCreated();

        $this->actingAs($this->secretary, 'clinic')
            ->getJson("/api/clinic/finances/transactions?q=zzz&q_patient_ids[]={$this->patient->id}")
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_the_summary_searches_the_patient_name_like_the_listing_and_ignores_patient_ids_from_the_client(): void
    {
        $this->createAs($this->secretary, ['patient_id' => $this->patient->id, 'description' => 'Pacote'])->assertCreated();

        // Os ids mandados pelo cliente não alargam as somas.
        $widened = $this->actingAs($this->secretary, 'clinic')
            ->getJson("/api/clinic/finances/summary?period=2026-10&q=zzz&q_patient_ids[]={$this->patient->id}")
            ->assertOk();
        $this->assertEquals(0, $widened->json('data.income.received'));

        // Como na listagem, a busca acha pelo nome do paciente.
        $byName = $this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/finances/summary?period=2026-10&q=maria')
            ->assertOk();
        $this->assertEquals(100, $byName->json('data.income.received'));
    }

    public function test_percent_and_underscore_in_the_patient_search_are_literal(): void
    {
        $this->createAs($this->secretary, ['patient_id' => $this->patient->id, 'description' => 'Pacote'])->assertCreated();
        $underscore = Patient::factory()->create(['clinic_id' => $this->clinic->id, 'name' => 'Ana_Lima']);
        $bang       = Patient::factory()->create(['clinic_id' => $this->clinic->id, 'name' => 'Zé!Ana']);

        // Sem escapar, "%%" traria todo paciente da clínica e "a_s" acharia "Maria Souza".
        foreach (['%%' => [], 'a_s' => [], 'a_l' => [$underscore->id], 'é!a' => [$bang->id]] as $term => $expected) {
            $found = $this->actingAs($this->secretary, 'clinic')
                ->getJson('/api/clinic/finances/patients?q=' . urlencode($term))
                ->assertOk()
                ->json('data');
            $this->assertSame($expected, array_column($found, 'id'), "seletor com {$term}");
        }

        foreach (['%%', 'a_s'] as $term) {
            $this->actingAs($this->secretary, 'clinic')
                ->getJson('/api/clinic/finances/transactions?q=' . urlencode($term))
                ->assertOk()
                ->assertJsonCount(0, 'data');
        }
    }

    public function test_patient_appointments_route_lists_the_patients_appointments_newest_first(): void
    {
        $older     = $this->appointment($this->clinic, $this->patient, '2026-10-01 09:00:00');
        $newer     = $this->appointment($this->clinic, $this->patient, '2026-10-15 09:00:00');
        $cancelled = $this->appointment($this->clinic, $this->patient, '2026-10-14 09:00:00');
        $cancelled->forceFill(['status' => AppointmentStatus::Cancelled])->save();
        $this->appointment($this->clinic, Patient::factory()->create(['clinic_id' => $this->clinic->id]), '2026-10-15 10:00:00');

        $admin = $this->userWithRole($this->clinic, ClinicUser::ROLE_ADMIN);
        foreach ([$this->secretary, $admin] as $user) {
            $rows = $this->actingAs($user, 'clinic')
                ->getJson("/api/clinic/finances/patients/{$this->patient->id}/appointments")
                ->assertOk()
                ->json('data');

            $this->assertSame([$newer->id, $older->id], array_column($rows, 'id'));
            $this->assertSame('Sessão de RPG', $rows[0]['title']);
            $this->assertStringStartsWith('2026-10-15T09:00:00', $rows[0]['starts_at']);
        }
    }

    public function test_patient_appointments_route_is_404_for_a_patient_of_another_clinic(): void
    {
        $other   = Clinic::factory()->create(['timezone' => 'UTC']);
        $foreign = Patient::factory()->create(['clinic_id' => $other->id]);
        $this->appointment($other, $foreign, '2026-10-15 09:00:00');

        $this->actingAs($this->secretary, 'clinic')
            ->getJson("/api/clinic/finances/patients/{$foreign->id}/appointments")
            ->assertNotFound();
    }

    public function test_physiotherapist_is_forbidden_on_the_patient_routes(): void
    {
        $physiotherapist = $this->userWithRole($this->clinic, ClinicUser::ROLE_PHYSIOTHERAPIST);

        $this->actingAs($physiotherapist, 'clinic')
            ->getJson("/api/clinic/finances/patients/{$this->patient->id}/appointments")
            ->assertForbidden();
        $this->actingAs($physiotherapist, 'clinic')
            ->getJson('/api/clinic/finances/patients?q=maria')
            ->assertForbidden();
    }

    public function test_patient_picker_searches_names_of_this_clinic_only(): void
    {
        Patient::factory()->create(['clinic_id' => $this->clinic->id, 'name' => 'Mariana Lima']);
        Patient::factory()->create(['clinic_id' => $this->clinic->id, 'name' => 'João Pedro']);
        Patient::factory()->create(['clinic_id' => Clinic::factory()->create()->id, 'name' => 'Maria Outra']);

        $this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/finances/patients?q=MARI')
            ->assertOk()
            ->assertExactJson(['data' => [
                ['id' => $this->patient->id, 'name' => 'Maria Souza'],
                ['id' => Patient::query()->where('name', 'Mariana Lima')->value('id'), 'name' => 'Mariana Lima'],
            ]]);

        $this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/finances/patients?q[]=x')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['q']);
    }

    public function test_csv_export_has_the_patient_column(): void
    {
        $this->createAs($this->secretary, ['patient_id' => $this->patient->id, 'description' => 'Pacote'])->assertCreated();
        $this->createAs($this->secretary, ['description' => 'Avulso', 'date' => '2026-10-16'])->assertCreated();

        $csv = $this->actingAs($this->secretary, 'clinic')
            ->get('/api/clinic/finances/export?format=csv&range=current_month')
            ->assertOk()
            ->streamedContent();

        $rows = array_map(fn (string $line) => str_getcsv($line, ';'), array_values(array_filter(explode("\n", $csv))));
        $col  = array_search('Paciente', $rows[0], true);

        $this->assertNotFalse($col, 'sem a coluna Paciente');
        $this->assertSame('Maria Souza', $rows[1][$col]);
        $this->assertSame('', $rows[2][$col]);
    }

    public function test_another_clinic_cannot_see_or_change_the_patient_link(): void
    {
        $id         = $this->createAs($this->secretary, ['patient_id' => $this->patient->id])->assertCreated()->json('data.id');
        $other      = Clinic::factory()->create(['timezone' => 'UTC']);
        $otherAdmin = $this->userWithRole($other, ClinicUser::ROLE_ADMIN);
        $ownPatient = Patient::factory()->create(['clinic_id' => $other->id]);

        $this->assertSame([], $this->day($otherAdmin));
        $this->assertSame([], $this->actingAs($otherAdmin, 'clinic')
            ->getJson('/api/clinic/finances/transactions?q=maria')->json('data'));
        $this->assertSame([], $this->actingAs($otherAdmin, 'clinic')
            ->getJson('/api/clinic/finances/patients?q=maria')->json('data'));
        $this->putAs($otherAdmin, $id, ['patient_id' => $ownPatient->id])->assertNotFound();

        $this->assertDatabaseHas('clinic_financial_transactions', ['id' => $id, 'patient_id' => $this->patient->id]);
    }

    public function test_editing_a_transaction_whose_patient_was_deleted_keeps_the_link(): void
    {
        $appointment = $this->appointment($this->clinic, $this->patient, '2026-10-15 09:00:00');
        $link        = ['patient_id' => $this->patient->id, 'appointment_id' => $appointment->id];
        $id          = $this->createAs($this->secretary, $link)->assertCreated()->json('data.id');
        $this->patient->delete();

        // O modal reenvia o paciente e o atendimento que já estavam no lançamento.
        $this->putAs($this->secretary, $id, [...$link, 'description' => 'Sessão corrigida'])->assertOk();
        $this->actingAs($this->secretary, 'clinic')
            ->patchJson("/api/clinic/finances/transactions/{$id}/status", ['status' => FinancialTransactionStatus::Pendente->value])
            ->assertOk();

        $this->assertDatabaseHas('clinic_financial_transactions', [...$link, 'id' => $id, 'description' => 'Sessão corrigida']);
    }

    public function test_switching_to_another_deleted_patient_or_to_an_appointment_of_someone_else_is_refused(): void
    {
        $id = $this->createAs($this->secretary, ['patient_id' => $this->patient->id])->assertCreated()->json('data.id');
        $this->patient->delete();

        $otherDeleted = Patient::factory()->create(['clinic_id' => $this->clinic->id]);
        $otherDeleted->delete();
        $this->putAs($this->secretary, $id, ['patient_id' => $otherDeleted->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['patient_id']);

        // Mesmo paciente (o já gravado), mas um atendimento que não é dele.
        $ofOtherPerson = $this->appointment($this->clinic, Patient::factory()->create(['clinic_id' => $this->clinic->id]), '2026-10-15 10:00:00');
        $this->putAs($this->secretary, $id, ['patient_id' => $this->patient->id, 'appointment_id' => $ofOtherPerson->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['appointment_id']);

        $this->assertDatabaseHas('clinic_financial_transactions', ['id' => $id, 'patient_id' => $this->patient->id, 'appointment_id' => null]);
    }

    public function test_the_kept_patient_rule_never_lets_in_a_patient_of_another_clinic(): void
    {
        $other        = Clinic::factory()->create(['timezone' => 'UTC']);
        $otherAdmin   = $this->userWithRole($other, ClinicUser::ROLE_ADMIN);
        $theirPatient = Patient::factory()->create(['clinic_id' => $other->id]);
        $theirs       = $this->actingAs($otherAdmin, 'clinic')
            ->postJson('/api/clinic/finances/transactions', [
                ...$this->payload(),
                'financial_category_id' => $this->systemCategory()->id,
                'patient_id'            => $theirPatient->id,
            ])
            ->assertCreated()
            ->json('data.id');
        $theirPatient->delete();
        $ours = $this->createAs($this->secretary)->assertCreated()->json('data.id');

        // Na edição do nosso lançamento, o paciente (excluído) da outra clínica não entra.
        $this->putAs($this->secretary, $ours, ['patient_id' => $theirPatient->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['patient_id']);
        // E o lançamento da outra clínica continua fechado, mesmo mandando o paciente que já está
        // nele (422 ou 404: hoje a validação roda antes da posse).
        $status = $this->putAs($this->secretary, $theirs, ['patient_id' => $theirPatient->id, 'description' => 'Invadido'])->status();
        $this->assertContains($status, [404, 422]);
        // A regra do paciente mantido, sozinha, também não vale para lançamento de outra clínica.
        $this->assertSame(
            ['patient_id' => 'Paciente não encontrado.'],
            app(TransactionPeopleServiceInterface::class)->linkErrors(
                $this->clinic->id,
                $theirPatient->id,
                null,
                FinancialTransaction::query()->findOrFail($theirs),
            ),
        );

        $this->assertDatabaseHas('clinic_financial_transactions', ['id' => $ours, 'patient_id' => null]);
        $this->assertDatabaseHas('clinic_financial_transactions', ['id' => $theirs, 'description' => 'Sessão']);
    }

    private function putAs(ClinicUser $user, int $id, array $overrides = []): TestResponse
    {
        return $this->actingAs($user, 'clinic')->putJson("/api/clinic/finances/transactions/{$id}", $this->payload($overrides));
    }

    private function createAs(ClinicUser $user, array $overrides = []): TestResponse
    {
        return $this->actingAs($user, 'clinic')->postJson('/api/clinic/finances/transactions', $this->payload($overrides));
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'date'                  => '2026-10-15',
            'description'           => 'Sessão',
            'financial_category_id' => $this->systemCategory()->id,
            'type'                  => FinancialTransactionType::Entrada->value,
            'status'                => FinancialTransactionStatus::Recebido->value,
            'payment_method'        => PaymentMethod::Pix->value,
            'gross_amount'          => 100,
            'fee_amount'            => 0,
        ], $overrides);
    }

    private function day(ClinicUser $user, string $date = '2026-10-15'): array
    {
        return $this->actingAs($user, 'clinic')
            ->getJson("/api/clinic/finances/transactions?from={$date}&to={$date}")
            ->assertOk()
            ->json('data');
    }

    private function appointment(Clinic $clinic, Patient $patient, string $startsAt): Appointment
    {
        return Appointment::factory()->create([
            'clinic_id'      => $clinic->id,
            'patient_id'     => $patient->id,
            'clinic_user_id' => $this->userWithRole($clinic, ClinicUser::ROLE_PHYSIOTHERAPIST)->id,
            'title'          => 'Sessão de RPG',
            'starts_at'      => $startsAt,
            'ends_at'        => date('Y-m-d H:i:s', strtotime($startsAt) + 3600),
        ]);
    }

    private function userWithRole(Clinic $clinic, string $role): ClinicUser
    {
        return ClinicUser::factory()->create(['clinic_id' => $clinic->id, 'role' => $role]);
    }

    private function systemCategory(FinancialTransactionType $type = FinancialTransactionType::Entrada): FinancialCategory
    {
        return FinancialCategory::query()
            ->whereNull('clinic_id')
            ->where('type', $type->value)
            ->firstOrFail();
    }
}
