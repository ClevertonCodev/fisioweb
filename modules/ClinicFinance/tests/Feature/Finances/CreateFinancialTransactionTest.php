<?php

namespace Modules\ClinicFinance\Tests\Feature\Finances;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Database\Seeders\FinancialCategorySeeder;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Enums\PaymentMethod;
use Modules\ClinicFinance\Models\FinancialCategory;
use Tests\TestCase;

class CreateFinancialTransactionTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    private FinancialCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinic = Clinic::factory()->create();
        $this->admin  = ClinicUser::factory()->create([
            'clinic_id' => $this->clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);

        $this->seed(FinancialCategorySeeder::class);
        $this->category = FinancialCategory::query()
            ->where('type', FinancialTransactionType::Entrada->value)
            ->firstOrFail();
    }

    public function test_admin_can_create_financial_transaction(): void
    {
        $payload = [
            'date'                  => now()->toDateString(),
            'description'           => 'Atendimento - João Silva',
            'financial_category_id' => $this->category->id,
            'type'                  => FinancialTransactionType::Entrada->value,
            'status'                => FinancialTransactionStatus::Recebido->value,
            'payment_method'        => PaymentMethod::Pix->value,
            'gross_amount'          => 150,
            'fee_amount'            => 0,
        ];

        $this->actingAs($this->admin, 'clinic')
            ->postJson('/api/clinic/finances/transactions', $payload)
            ->assertCreated()
            ->assertJsonPath('data.description', 'Atendimento - João Silva')
            ->assertJsonPath('data.net_amount', '150.00');

        $this->assertDatabaseHas('clinic_financial_transactions', [
            'clinic_id'   => $this->clinic->id,
            'description' => 'Atendimento - João Silva',
        ]);
    }

    public function test_secretary_cannot_access_finances(): void
    {
        $secretary = ClinicUser::factory()->create([
            'clinic_id' => $this->clinic->id,
            'role'      => ClinicUser::ROLE_SECRETARY,
        ]);

        $this->actingAs($secretary, 'clinic')
            ->getJson('/api/clinic/finances/transactions')
            ->assertForbidden();
    }
}
