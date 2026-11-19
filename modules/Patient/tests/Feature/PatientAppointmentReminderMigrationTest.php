<?php

namespace Modules\Patient\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PatientAppointmentReminderMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_existing_patients_keep_receiving_appointment_reminder(): void
    {
        $migration = require base_path('modules/Patient/database/migrations/2026_11_18_000001_add_receives_appointment_reminder_email_to_patients_table.php');
        $existing  = Patient::factory()->create();

        $migration->down();
        $migration->up();

        $this->assertTrue((bool) DB::table('patients')->where('id', $existing->id)->value('receives_appointment_reminder_email'));
        $this->assertTrue($existing->fresh()->receives_appointment_reminder_email);
    }
}
