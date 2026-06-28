<?php

namespace Modules\ClinicFinance\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class FinancialExportControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_export_returns_422_when_interval_has_no_transactions(): void
    {
        $clinic = Clinic::factory()->create();
        $admin  = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);

        $this->actingAs($admin, 'clinic')
            ->getJson('/api/clinic/finances/export?format=csv&range=current_month')
            ->assertUnprocessable()
            ->assertJsonPath('message', 'intervalo sem transações para exportar');
    }
}
