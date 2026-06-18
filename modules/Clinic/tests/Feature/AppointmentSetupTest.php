<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Modules\Clinic\Models\Clinic;
use Tests\TestCase;

/**
 * Phase 1 (Setup) da feature 002-appointment-scheduling.
 * Cobre T002 (config services.google) e T003 (timezone da clínica).
 */
class AppointmentSetupTest extends TestCase
{
    use RefreshDatabase;

    public function test_clinics_table_has_timezone_column(): void
    {
        $this->assertTrue(
            Schema::hasColumn('clinics', 'timezone'),
            'A tabela clinics deve ter a coluna timezone.'
        );
    }

    public function test_clinic_timezone_defaults_to_sao_paulo(): void
    {
        $clinic = Clinic::factory()->create();

        $this->assertSame('America/Sao_Paulo', $clinic->fresh()->timezone);
    }

    public function test_clinic_timezone_is_mass_assignable(): void
    {
        $clinic = Clinic::factory()->create(['timezone' => 'America/New_York']);

        $this->assertSame('America/New_York', $clinic->fresh()->timezone);
    }

    public function test_google_services_config_exposes_oauth_keys(): void
    {
        $google = config('services.google');

        $this->assertIsArray($google);
        $this->assertArrayHasKey('client_id', $google);
        $this->assertArrayHasKey('client_secret', $google);
        $this->assertArrayHasKey('redirect', $google);
    }
}
