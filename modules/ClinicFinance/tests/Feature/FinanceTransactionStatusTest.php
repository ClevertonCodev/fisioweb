<?php

namespace Modules\ClinicFinance\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Contracts\FinancialTransactionServiceInterface;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Enums\PaymentMethod;
use Modules\ClinicFinance\Events\FinancialTransactionUpdated;
use Modules\ClinicFinance\Models\FinancialCategory;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Tests\TestCase;

/**
 * PATCH /clinic/finances/transactions/{id}/status: a baixa em um clique (e o "Desfazer").
 * Muda só o status, validado contra o tipo do lançamento.
 */
class FinanceTransactionStatusTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    protected function setUp(): void
    {
        parent::setUp();

        // O lançamento é de 10/09; o relógio fica num dia fixo depois dele.
        $this->travelTo(now()->setDate(2026, 10, 15)->setTime(12, 0));

        $this->clinic = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->admin  = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id]);
    }

    public function test_marking_a_pending_income_as_received_changes_only_the_status(): void
    {
        $tx = $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente);

        $this->patchStatus($tx, 'recebido')
            ->assertOk()
            ->assertJsonPath('data.id', $tx->id)
            ->assertJsonPath('data.status', 'recebido');

        $fresh = $tx->fresh();
        $this->assertSame(FinancialTransactionStatus::Recebido, $fresh->status);
        $this->assertSame('2026-09-10', $fresh->date->toDateString());
        $this->assertSame(PaymentMethod::Boleto, $fresh->payment_method);
        $this->assertEquals(120.0, (float) $fresh->gross_amount);
        $this->assertEquals(5.0, (float) $fresh->fee_amount);
        $this->assertEquals(115.0, (float) $fresh->net_amount);
        $this->assertSame('Sessão avulsa', $fresh->description);
        $this->assertSame('Observação original', $fresh->notes);
    }

    public function test_status_must_be_valid_for_the_transaction_type(): void
    {
        $income  = $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente);
        $expense = $this->transaction($this->clinic, FinancialTransactionType::Saida, FinancialTransactionStatus::Pendente);

        $this->patchStatus($income, 'pago')->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->patchStatus($expense, 'recebido')->assertUnprocessable()->assertJsonValidationErrors('status');

        $this->assertSame(FinancialTransactionStatus::Pendente, $income->fresh()->status);
        $this->assertSame(FinancialTransactionStatus::Pendente, $expense->fresh()->status);
    }

    public function test_another_clinic_gets_404_and_changes_nothing_in_either_direction(): void
    {
        $other          = Clinic::factory()->create(['timezone' => 'UTC']);
        $otherAdmin     = ClinicUser::factory()->create(['clinic_id' => $other->id]);
        $otherSecretary = ClinicUser::factory()->create(['clinic_id' => $other->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $mine           = $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente);
        $theirs         = $this->transaction($other, FinancialTransactionType::Saida, FinancialTransactionStatus::Pago);

        $this->patchStatus($mine, 'recebido', $otherAdmin)->assertNotFound();
        $this->patchStatus($mine, 'recebido', $otherSecretary)->assertNotFound();
        $this->patchStatus($theirs, 'pendente')->assertNotFound();

        $this->assertSame(FinancialTransactionStatus::Pendente, $mine->fresh()->status);
        $this->assertSame(FinancialTransactionStatus::Pago, $theirs->fresh()->status);
    }

    public function test_secretary_marks_and_undoes_while_physiotherapist_is_forbidden(): void
    {
        $tx              = $this->transaction($this->clinic, FinancialTransactionType::Saida, FinancialTransactionStatus::Pendente);
        $secretary       = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $physiotherapist = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);

        $this->patchStatus($tx, 'pago', $physiotherapist)->assertForbidden();
        $this->assertSame(FinancialTransactionStatus::Pendente, $tx->fresh()->status);

        $this->patchStatus($tx, 'pago', $secretary)->assertOk()->assertJsonPath('data.status', 'pago');
        $this->patchStatus($tx, 'pendente', $secretary)->assertOk()->assertJsonPath('data.status', 'pendente');
        $this->assertSame(FinancialTransactionStatus::Pendente, $tx->fresh()->status);
    }

    public function test_marking_dispatches_the_updated_event_with_only_the_status_changed(): void
    {
        Event::fake([FinancialTransactionUpdated::class]);
        $tx = $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente);

        $this->patchStatus($tx, 'recebido')->assertOk();

        Event::assertDispatched(
            FinancialTransactionUpdated::class,
            fn (FinancialTransactionUpdated $event) => $event->transactionId === $tx->id
                && $event->clinicId === $this->clinic->id
                && $event->actorId === $this->admin->id
                && $event->changedFields === ['status']
                && $event->status === 'recebido',
        );
    }

    public function test_unknown_or_missing_status_and_trashed_transaction_are_rejected(): void
    {
        $tx = $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente);

        $this->patchStatus($tx, 'quitado')->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->actingAs($this->admin, 'clinic')
            ->patchJson("/api/clinic/finances/transactions/{$tx->id}/status", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');

        $tx->delete();
        $this->patchStatus($tx, 'recebido')->assertNotFound();
        $this->assertSame(FinancialTransactionStatus::Pendente, FinancialTransaction::withTrashed()->find($tx->id)->status);
    }

    public function test_the_service_answers_404_when_the_transaction_went_to_the_trash_after_the_route_found_it(): void
    {
        // A rota achou o lançamento, mas uma divisão ou exclusão da série o mandou para a lixeira antes da baixa.
        $tx = $this->transaction($this->clinic, FinancialTransactionType::Entrada, FinancialTransactionStatus::Pendente);
        $tx->delete();

        try {
            app(FinancialTransactionServiceInterface::class)->changeStatus($this->clinic->id, $tx->id, FinancialTransactionStatus::Recebido);
            $this->fail('A baixa num lançamento da lixeira deveria responder 404.');
        } catch (HttpExceptionInterface $e) {
            $this->assertSame(404, $e->getStatusCode());
        }

        $this->assertSame(FinancialTransactionStatus::Pendente, FinancialTransaction::withTrashed()->find($tx->id)->status);
    }

    /** @var array<string, FinancialCategory> */
    private array $categories = [];

    private function patchStatus(FinancialTransaction $tx, mixed $status, ?ClinicUser $user = null): \Illuminate\Testing\TestResponse
    {
        return $this->actingAs($user ?? $this->admin, 'clinic')
            ->patchJson("/api/clinic/finances/transactions/{$tx->id}/status", ['status' => $status]);
    }

    private function category(Clinic $clinic, FinancialTransactionType $type): FinancialCategory
    {
        return $this->categories["{$clinic->id}-{$type->value}"] ??= FinancialCategory::factory()->create([
            'clinic_id' => $clinic->id,
            'type'      => $type,
            'name'      => "Categoria {$type->value}",
        ]);
    }

    private function transaction(Clinic $clinic, FinancialTransactionType $type, FinancialTransactionStatus $status): FinancialTransaction
    {
        return FinancialTransaction::factory()->create([
            'clinic_id'             => $clinic->id,
            'financial_category_id' => $this->category($clinic, $type)->id,
            'created_by_user_id'    => $this->admin->id,
            'type'                  => $type,
            'status'                => $status,
            'payment_method'        => PaymentMethod::Boleto,
            'date'                  => '2026-09-10',
            'description'           => 'Sessão avulsa',
            'notes'                 => 'Observação original',
            'gross_amount'          => 120,
            'fee_amount'            => 5,
            'net_amount'            => FinancialTransaction::computeNetAmount(120, 5),
        ]);
    }
}
