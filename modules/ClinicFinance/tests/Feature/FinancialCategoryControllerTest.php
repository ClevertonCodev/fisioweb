<?php

namespace Modules\ClinicFinance\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Database\Seeders\FinancialCategorySeeder;
use Tests\TestCase;

class FinancialCategoryControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_data_envelope(): void
    {
        $clinic = Clinic::factory()->create();
        $admin  = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);

        $this->seed(FinancialCategorySeeder::class);

        $this->actingAs($admin, 'clinic')
            ->getJson('/api/clinic/finances/categories')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }
}
