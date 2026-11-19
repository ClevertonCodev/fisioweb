<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Clinic\Models\Clinic;
use Tests\TestCase;

class ClinicAppointmentReminderMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_existing_clinics_get_appointment_reminder_disabled(): void
    {
        $migration = require base_path('modules/Clinic/database/migrations/2026_11_18_000001_add_appointment_reminder_email_enabled_to_clinics_table.php');
        $existing  = Clinic::factory()->create();

        $migration->down();
        $migration->up();

        $this->assertFalse((bool) DB::table('clinics')->where('id', $existing->id)->value('appointment_reminder_email_enabled'));
        $this->assertFalse($existing->fresh()->appointment_reminder_email_enabled);
    }

    public function test_new_clinic_starts_with_appointment_reminder_disabled_before_reload(): void
    {
        $this->assertFalse((new Clinic)->appointment_reminder_email_enabled);
        $this->assertFalse(Clinic::factory()->create()->appointment_reminder_email_enabled);
    }
}
