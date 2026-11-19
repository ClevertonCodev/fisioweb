<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class ClinicProfileControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_cannot_view_profile(): void
    {
        $this->getJson('/api/clinic/profile')->assertUnauthorized();
    }

    public function test_admin_sees_only_own_clinic_profile(): void
    {
        $otherClinic = Clinic::factory()->create();
        $admin       = ClinicUser::factory()->create();

        $response = $this->actingAs($admin, 'clinic')
            ->getJson('/api/clinic/profile')
            ->assertOk()
            ->assertJsonPath('data.id', $admin->clinic_id)
            ->assertJsonPath('data.name', $admin->clinic->name);

        $this->assertNotSame($otherClinic->id, $response->json('data.id'));
        $this->assertNotSame($otherClinic->name, $response->json('data.name'));
    }

    public function test_physiotherapist_cannot_view_profile(): void
    {
        $physio = ClinicUser::factory()->create(['role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);

        $this->actingAs($physio, 'clinic')
            ->getJson('/api/clinic/profile')
            ->assertForbidden();
    }

    public function test_master_admin_updates_only_own_clinic(): void
    {
        $otherClinic = Clinic::factory()->create(['name' => 'Clínica B']);
        $admin       = ClinicUser::factory()->create(['mestre' => ClinicUser::MESTRE_YES]);

        $this->actingAs($admin, 'clinic')
            ->putJson('/api/clinic/profile', $this->validPayload())
            ->assertOk()
            ->assertJsonPath('data.id', $admin->clinic_id)
            ->assertJsonPath('data.name', 'Clínica A Atualizada');

        $this->assertDatabaseHas('clinics', ['id' => $admin->clinic_id, 'name' => 'Clínica A Atualizada']);
        $this->assertDatabaseHas('clinics', ['id' => $otherClinic->id, 'name' => 'Clínica B']);
    }

    public function test_non_master_admin_cannot_update_profile(): void
    {
        $admin = ClinicUser::factory()->create(['mestre' => ClinicUser::MESTRE_NO]);

        $this->actingAs($admin, 'clinic')
            ->putJson('/api/clinic/profile', $this->validPayload())
            ->assertForbidden();

        $this->assertDatabaseMissing('clinics', ['name' => 'Clínica A Atualizada']);
    }

    public function test_physiotherapist_cannot_update_profile(): void
    {
        $physio = ClinicUser::factory()->create([
            'role'   => ClinicUser::ROLE_PHYSIOTHERAPIST,
            'mestre' => ClinicUser::MESTRE_YES,
        ]);

        $this->actingAs($physio, 'clinic')
            ->putJson('/api/clinic/profile', $this->validPayload())
            ->assertForbidden();

        $this->assertDatabaseMissing('clinics', ['name' => 'Clínica A Atualizada']);
    }

    public function test_profile_shows_appointment_reminder_disabled_by_default(): void
    {
        $admin = ClinicUser::factory()->create(['mestre' => ClinicUser::MESTRE_NO]);

        $this->actingAs($admin, 'clinic')
            ->getJson('/api/clinic/profile')
            ->assertOk()
            ->assertJsonPath('data.appointment_reminder_email_enabled', false);
    }

    public function test_master_admin_turns_appointment_reminder_on_and_off_only_for_own_clinic(): void
    {
        $otherClinic = Clinic::factory()->create();
        $master      = ClinicUser::factory()->create(['mestre' => ClinicUser::MESTRE_YES]);

        $this->actingAs($master, 'clinic')
            ->putJson('/api/clinic/profile', [
                ...$this->validPayload(),
                'appointment_reminder_email_enabled' => true,
            ])
            ->assertOk()
            ->assertJsonPath('data.appointment_reminder_email_enabled', true);

        $this->assertTrue($master->clinic->fresh()->appointment_reminder_email_enabled);
        $this->assertFalse($otherClinic->fresh()->appointment_reminder_email_enabled);

        $this->actingAs($master, 'clinic')
            ->putJson('/api/clinic/profile', [
                ...$this->validPayload(),
                'appointment_reminder_email_enabled' => false,
            ])
            ->assertOk()
            ->assertJsonPath('data.appointment_reminder_email_enabled', false);

        $this->assertFalse($master->clinic->fresh()->appointment_reminder_email_enabled);
    }

    public function test_non_master_admin_cannot_turn_appointment_reminder_on(): void
    {
        $admin = ClinicUser::factory()->create(['mestre' => ClinicUser::MESTRE_NO]);

        $this->actingAs($admin, 'clinic')
            ->putJson('/api/clinic/profile', [
                ...$this->validPayload(),
                'appointment_reminder_email_enabled' => true,
            ])
            ->assertForbidden();

        $this->assertFalse($admin->clinic->fresh()->appointment_reminder_email_enabled);
    }

    public function test_update_without_appointment_reminder_keeps_current_value(): void
    {
        $master = ClinicUser::factory()->create(['mestre' => ClinicUser::MESTRE_YES]);
        $master->clinic->update(['appointment_reminder_email_enabled' => true]);

        $this->actingAs($master, 'clinic')
            ->putJson('/api/clinic/profile', $this->validPayload())
            ->assertOk()
            ->assertJsonPath('data.appointment_reminder_email_enabled', true);
    }

    public function test_appointment_reminder_must_be_boolean(): void
    {
        $master = ClinicUser::factory()->create(['mestre' => ClinicUser::MESTRE_YES]);

        $this->actingAs($master, 'clinic')
            ->putJson('/api/clinic/profile', [
                ...$this->validPayload(),
                'appointment_reminder_email_enabled' => 'talvez',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('appointment_reminder_email_enabled');
    }

    private function validPayload(): array
    {
        return [
            'name'        => 'Clínica A Atualizada',
            'email'       => 'contato-a@example.com',
            'document'    => '11222333000181',
            'type_person' => Clinic::TYPE_PERSON_JURIDICA,
        ];
    }
}
