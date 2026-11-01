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
use Modules\ClinicScheduling\Models\Appointment;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

/**
 * O que toda resposta de lançamento traz (revisão da 013): de quem lançou e de quem excluiu, só
 * `id` e `name` (a secretária não vê e-mail, CPF, papel nem os dados do Google de ninguém), e o
 * paciente e o atendimento preenchidos em toda rota que devolve o lançamento.
 */
class FinanceTransactionResponseShapeTest extends TestCase
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
        $this->secretary = ClinicUser::factory()->create([
            'clinic_id' => $this->clinic->id,
            'role'      => ClinicUser::ROLE_SECRETARY,
            'document'  => '12345678909',
        ]);
    }

    public function test_secretary_sees_only_id_and_name_of_who_created_and_who_deleted(): void
    {
        $author = ClinicUser::factory()->create([
            'clinic_id' => $this->clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
            'name'      => 'Ana Admin',
            'document'  => '98765432100',
        ]);
        $id = $this->actingAs($author, 'clinic')
            ->postJson('/api/clinic/finances/transactions', $this->payload())
            ->assertCreated()
            ->json('data.id');
        $expected = ['id' => $author->id, 'name' => 'Ana Admin'];

        $listed = $this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/finances/transactions?period=2026-10')
            ->assertOk()
            ->json('data.0.created_by');
        $this->assertSame($expected, $listed);

        $shown = $this->actingAs($this->secretary, 'clinic')
            ->getJson("/api/clinic/finances/transactions/{$id}")
            ->assertOk()
            ->json('data.created_by');
        $this->assertSame($expected, $shown);

        $updated = $this->actingAs($this->secretary, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$id}", $this->payload(['description' => 'Editado']))
            ->assertOk()
            ->json('data');
        $this->assertSame($expected, $updated['created_by']);

        $status = $this->actingAs($this->secretary, 'clinic')
            ->patchJson("/api/clinic/finances/transactions/{$id}/status", ['status' => FinancialTransactionStatus::Pendente->value])
            ->assertOk()
            ->json('data');
        $this->assertSame($expected, $status['created_by']);

        $this->actingAs($author, 'clinic')->deleteJson("/api/clinic/finances/transactions/{$id}")->assertNoContent();
        $trashed = $this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/finances/transactions/trash')
            ->assertOk()
            ->json('data.0.deleted_by');
        $this->assertSame($expected, $trashed);

        $restored = $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/finances/transactions/{$id}/restore")
            ->assertOk()
            ->json('data');
        $this->assertSame($expected, $restored['created_by']);

        $own = $this->actingAs($this->secretary, 'clinic')
            ->postJson('/api/clinic/finances/transactions', $this->payload())
            ->assertCreated()
            ->json('data.created_by');
        $this->assertSame(['id' => $this->secretary->id, 'name' => $this->secretary->name], $own);
    }

    public function test_show_update_restore_and_status_bring_the_patient_name_and_the_appointment_time(): void
    {
        $patient     = Patient::factory()->create(['clinic_id' => $this->clinic->id, 'name' => 'Maria Souza']);
        $appointment = Appointment::factory()->create([
            'clinic_id'      => $this->clinic->id,
            'patient_id'     => $patient->id,
            'clinic_user_id' => ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST])->id,
            'title'          => 'Sessão',
            'starts_at'      => '2026-10-15 09:00:00',
            'ends_at'        => '2026-10-15 10:00:00',
        ]);
        $id = $this->actingAs($this->secretary, 'clinic')
            ->postJson('/api/clinic/finances/transactions', $this->payload([
                'patient_id'     => $patient->id,
                'appointment_id' => $appointment->id,
            ]))
            ->assertCreated()
            ->json('data.id');

        $shown = $this->actingAs($this->secretary, 'clinic')
            ->getJson("/api/clinic/finances/transactions/{$id}")
            ->assertOk();
        $shown->assertJsonPath('data.patient', ['id' => $patient->id, 'name' => 'Maria Souza']);
        $this->assertSame($appointment->id, $shown->json('data.appointment.id'));
        $this->assertStringStartsWith('2026-10-15T09:00:00', (string) $shown->json('data.appointment.starts_at'));

        $updated = $this->actingAs($this->secretary, 'clinic')
            ->putJson("/api/clinic/finances/transactions/{$id}", $this->payload([
                'description'    => 'Sessão corrigida',
                'patient_id'     => $patient->id,
                'appointment_id' => $appointment->id,
            ]))
            ->assertOk();
        $updated->assertJsonPath('data.patient.name', 'Maria Souza');
        $this->assertStringStartsWith('2026-10-15T09:00:00', (string) $updated->json('data.appointment.starts_at'));

        $status = $this->actingAs($this->secretary, 'clinic')
            ->patchJson("/api/clinic/finances/transactions/{$id}/status", ['status' => FinancialTransactionStatus::Pendente->value])
            ->assertOk();
        $status->assertJsonPath('data.patient.name', 'Maria Souza');
        $this->assertStringStartsWith('2026-10-15T09:00:00', (string) $status->json('data.appointment.starts_at'));

        $this->actingAs($this->secretary, 'clinic')->deleteJson("/api/clinic/finances/transactions/{$id}")->assertNoContent();
        $restored = $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/finances/transactions/{$id}/restore")
            ->assertOk();
        $restored->assertJsonPath('data.patient.name', 'Maria Souza');
        $this->assertStringStartsWith('2026-10-15T09:00:00', (string) $restored->json('data.appointment.starts_at'));
    }

    public function test_another_clinic_still_gets_404_on_show_status_and_restore(): void
    {
        $id    = $this->actingAs($this->secretary, 'clinic')
            ->postJson('/api/clinic/finances/transactions', $this->payload())
            ->assertCreated()
            ->json('data.id');
        $other = ClinicUser::factory()->create([
            'clinic_id' => Clinic::factory()->create(['timezone' => 'UTC'])->id,
            'role'      => ClinicUser::ROLE_SECRETARY,
        ]);

        $this->actingAs($other, 'clinic')->getJson("/api/clinic/finances/transactions/{$id}")->assertNotFound();
        $this->actingAs($other, 'clinic')
            ->patchJson("/api/clinic/finances/transactions/{$id}/status", ['status' => FinancialTransactionStatus::Pendente->value])
            ->assertNotFound();
        $this->actingAs($this->secretary, 'clinic')->deleteJson("/api/clinic/finances/transactions/{$id}")->assertNoContent();
        $this->actingAs($other, 'clinic')->postJson("/api/clinic/finances/transactions/{$id}/restore")->assertNotFound();
        $this->assertSoftDeleted('clinic_financial_transactions', ['id' => $id]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'date'                  => '2026-10-15',
            'description'           => 'Sessão',
            'financial_category_id' => FinancialCategory::query()
                ->whereNull('clinic_id')
                ->where('type', FinancialTransactionType::Entrada->value)
                ->firstOrFail()
                ->id,
            'type'                  => FinancialTransactionType::Entrada->value,
            'status'                => FinancialTransactionStatus::Recebido->value,
            'payment_method'        => PaymentMethod::Pix->value,
            'gross_amount'          => 100,
            'fee_amount'            => 0,
        ], $overrides);
    }
}
