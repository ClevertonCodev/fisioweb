<?php

namespace Modules\ClinicFinance\Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Events\FinancialCategoryCreated;
use Modules\ClinicFinance\Events\OpeningBalanceUpdated;
use Modules\ClinicFinance\Services\FinanceSummaryService;
use Modules\ClinicFinance\Services\FinancialCategoryService;
use Tests\TestCase;

class FinancialCategoryAndBalanceEventTest extends TestCase
{
    use RefreshDatabase;

    public function test_category_and_opening_balance_services_dispatch_events(): void
    {
        Event::fake();

        $clinic = Clinic::factory()->create();
        $admin  = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);

        $this->actingAs($admin, 'clinic');

        app(FinancialCategoryService::class)->create($clinic->id, [
            'name' => 'Pilates',
            'type' => 'entrada',
        ]);

        app(FinanceSummaryService::class)->updateOpeningBalance($clinic->id, 2026, 6, '1000.00', $admin->id);

        Event::assertDispatched(FinancialCategoryCreated::class);
        Event::assertDispatched(OpeningBalanceUpdated::class);
    }
}
