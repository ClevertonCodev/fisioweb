<?php

namespace Modules\ClinicFinance\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Database\Seeders\FinancialCategorySeeder;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Models\FinancialCategory;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Tests\TestCase;

class FinancialTransactionControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_data_and_meta_envelope(): void
    {
        [$clinic, $admin, $category] = $this->financeContext();

        FinancialTransaction::factory()->create([
            'clinic_id'             => $clinic->id,
            'financial_category_id' => $category->id,
            'created_by_user_id'    => $admin->id,
        ]);

        $this->actingAs($admin, 'clinic')
            ->getJson('/api/clinic/finances/transactions')
            ->assertOk()
            ->assertJsonStructure([
                'data',
                'meta' => ['page', 'perPage', 'total'],
            ]);
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
