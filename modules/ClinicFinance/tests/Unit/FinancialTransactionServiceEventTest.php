<?php

namespace Modules\ClinicFinance\Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Database\Seeders\FinancialCategorySeeder;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Enums\PaymentMethod;
use Modules\ClinicFinance\Events\FinancialTransactionDeleted;
use Modules\ClinicFinance\Events\FinancialTransactionRecorded;
use Modules\ClinicFinance\Events\FinancialTransactionUpdated;
use Modules\ClinicFinance\Models\FinancialCategory;
use Modules\ClinicFinance\Services\FinancialTransactionService;
use Tests\TestCase;

class FinancialTransactionServiceEventTest extends TestCase
{
    use RefreshDatabase;

    public function test_transaction_service_dispatches_recorded_updated_and_deleted_events(): void
    {
        Event::fake();

        [$clinic, $admin, $category] = $this->financeContext();
        $this->actingAs($admin, 'clinic');

        $service = app(FinancialTransactionService::class);

        $transaction = $service->create($clinic->id, [
            'date'                  => now()->toDateString(),
            'description'           => 'Atendimento',
            'financial_category_id' => $category->id,
            'type'                  => FinancialTransactionType::Entrada->value,
            'status'                => FinancialTransactionStatus::Recebido->value,
            'payment_method'        => PaymentMethod::Pix->value,
            'gross_amount'          => 150,
            'fee_amount'            => 0,
        ]);

        $service->update($clinic->id, $transaction->id, ['gross_amount' => 200]);
        $service->softDelete($clinic->id, $transaction->id);

        Event::assertDispatched(FinancialTransactionRecorded::class);
        Event::assertDispatched(FinancialTransactionUpdated::class);
        Event::assertDispatched(FinancialTransactionDeleted::class);
    }

    /**
     * @return array{0: Clinic, 1: ClinicUser, 2: FinancialCategory}
     */
    private function financeContext(): array
    {
        $clinic = Clinic::factory()->create();
        $admin  = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);

        $this->seed(FinancialCategorySeeder::class);

        $category = FinancialCategory::query()
            ->where('type', FinancialTransactionType::Entrada->value)
            ->firstOrFail();

        return [$clinic, $admin, $category];
    }
}
