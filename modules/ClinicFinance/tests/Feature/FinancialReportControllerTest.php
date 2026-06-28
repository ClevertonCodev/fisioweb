<?php

namespace Modules\ClinicFinance\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class FinancialReportControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_summary_report_returns_data_envelope(): void
    {
        $clinic = Clinic::factory()->create();
        $admin  = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);

        $this->actingAs($admin, 'clinic')
            ->getJson('/api/clinic/finances/reports/summary')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'period'    => ['year', 'month'],
                    'totals'    => ['income', 'expense', 'balance'],
                    'variation' => ['income', 'expense', 'balance'],
                ],
            ]);
    }
}
