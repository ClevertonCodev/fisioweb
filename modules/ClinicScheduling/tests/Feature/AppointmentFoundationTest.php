<?php

namespace Modules\ClinicScheduling\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Models\Appointment;
use Tests\TestCase;

class AppointmentFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_clinic_appointments_table_has_expected_columns(): void
    {
        foreach ([
            'clinic_id', 'patient_id', 'clinic_user_id', 'title', 'description',
            'location', 'starts_at', 'ends_at', 'status', 'google_event_id',
            'source', 'last_synced_at',
        ] as $column) {
            $this->assertTrue(
                Schema::hasColumn('clinic_appointments', $column),
                "clinic_appointments deve ter a coluna {$column}."
            );
        }
    }

    public function test_clinic_users_table_has_google_columns(): void
    {
        foreach ([
            'google_access_token', 'google_refresh_token', 'google_token_expires_at',
            'google_calendar_id', 'google_sync_token', 'google_connected_at',
        ] as $column) {
            $this->assertTrue(
                Schema::hasColumn('clinic_users', $column),
                "clinic_users deve ter a coluna {$column}."
            );
        }
    }

    public function test_factory_creates_appointment_with_enum_and_datetime_casts(): void
    {
        $appointment = Appointment::factory()->create();

        $this->assertInstanceOf(AppointmentStatus::class, $appointment->status);
        $this->assertSame(AppointmentStatus::Scheduled, $appointment->status);
        $this->assertTrue($appointment->starts_at->lessThan($appointment->ends_at));
    }

    public function test_appointment_relationships_resolve(): void
    {
        $appointment = Appointment::factory()->create();

        $this->assertNotNull($appointment->clinic);
        $this->assertNotNull($appointment->clinicUser);
        $this->assertNotNull($appointment->patient);
    }

    public function test_clinic_user_is_google_connected_reflects_connected_at(): void
    {
        $disconnected = ClinicUser::factory()->create();
        $connected    = ClinicUser::factory()->create(['google_connected_at' => now()]);

        $this->assertFalse($disconnected->isGoogleConnected());
        $this->assertTrue($connected->fresh()->isGoogleConnected());
    }

    public function test_google_tokens_are_encrypted_at_rest(): void
    {
        $user = ClinicUser::factory()->create(['google_access_token' => 'plain-token-123']);

        $raw = \DB::table('clinic_users')->where('id', $user->id)->value('google_access_token');

        $this->assertNotSame('plain-token-123', $raw, 'Token deve estar criptografado no banco.');
        $this->assertSame('plain-token-123', $user->fresh()->google_access_token);
    }

    public function test_policy_lets_physiotherapist_manage_only_own_appointments(): void
    {
        $clinic = Clinic::factory()->create();
        $physio = ClinicUser::factory()->create(['clinic_id' => $clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $other  = ClinicUser::factory()->create(['clinic_id' => $clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);

        $ownAppointment   = Appointment::factory()->create(['clinic_id' => $clinic->id, 'clinic_user_id' => $physio->id]);
        $otherAppointment = Appointment::factory()->create(['clinic_id' => $clinic->id, 'clinic_user_id' => $other->id]);

        $this->assertTrue(Gate::forUser($physio)->allows('update', $ownAppointment));
        $this->assertFalse(Gate::forUser($physio)->allows('update', $otherAppointment));
    }

    public function test_policy_lets_secretary_manage_any_appointment_in_clinic(): void
    {
        $clinic    = Clinic::factory()->create();
        $secretary = ClinicUser::factory()->create(['clinic_id' => $clinic->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $physio    = ClinicUser::factory()->create(['clinic_id' => $clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);

        $appointment = Appointment::factory()->create(['clinic_id' => $clinic->id, 'clinic_user_id' => $physio->id]);

        $this->assertTrue(Gate::forUser($secretary)->allows('update', $appointment));
        $this->assertTrue(Gate::forUser($secretary)->allows('cancel', $appointment));
    }
}
