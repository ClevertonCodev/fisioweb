<?php

namespace Modules\ClinicScheduling\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PatientAppointmentHistoryTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $secretary;

    private ClinicUser $fulano;

    private ClinicUser $sicrano;

    private ClinicUser $outsider;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinic    = Clinic::factory()->create();
        $this->secretary = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $this->fulano    = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->sicrano   = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->outsider  = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->patient   = Patient::factory()->create(['clinic_id' => $this->clinic->id]);
    }

    private function appointment(ClinicUser $physio, int $daysFromNow, array $overrides = []): Appointment
    {
        $start = now()->startOfHour()->addDays($daysFromNow);

        return Appointment::factory()->create(array_merge([
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $physio->id,
            'patient_id'     => $this->patient->id,
            'starts_at'      => $start,
            'ends_at'        => $start->copy()->addHour(),
            'description'    => 'Observação clínica',
            'location'       => 'Clínica · Sala 2',
        ], $overrides));
    }

    private function url(?Patient $patient = null): string
    {
        return '/api/clinic/patients/' . ($patient ?? $this->patient)->id . '/appointments';
    }

    public function test_covering_physio_sees_all_appointments_of_the_patient(): void
    {
        $first  = $this->appointment($this->fulano, -14, ['status' => AppointmentStatus::Completed]);
        $second = $this->appointment($this->fulano, -7, ['status' => AppointmentStatus::Completed]);
        $mine   = $this->appointment($this->sicrano, 3);

        $response = $this->actingAs($this->sicrano, 'clinic')
            ->getJson($this->url())
            ->assertOk()
            ->assertJsonCount(3, 'data.data')
            ->assertJsonPath('data.total', 3);

        // Da mais recente para a mais antiga.
        $this->assertSame([$mine->id, $second->id, $first->id], array_column($response->json('data.data'), 'id'));
        $this->assertSame($this->fulano->name, $response->json('data.data.2.clinic_user_name'));
        $this->assertSame('completed', $response->json('data.data.2.status'));
        $this->assertSame(
            ['id', 'starts_at', 'ends_at', 'title', 'clinic_user_name', 'status'],
            array_keys($response->json('data.data.0')),
        );
    }

    public function test_covering_physio_keeps_access_after_his_appointment_is_completed(): void
    {
        $this->appointment($this->fulano, -14, ['status' => AppointmentStatus::Completed]);
        $this->appointment($this->sicrano, -3, ['status' => AppointmentStatus::Completed]);

        $this->actingAs($this->sicrano, 'clinic')
            ->getJson($this->url())
            ->assertOk()
            ->assertJsonCount(2, 'data.data');
    }

    public function test_secretary_and_admin_see_everything_without_notes_or_location(): void
    {
        $this->appointment($this->fulano, -7);
        $this->appointment($this->sicrano, 2, ['status' => AppointmentStatus::Cancelled]);
        $admin = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);

        foreach ([$this->secretary, $admin] as $user) {
            $response = $this->actingAs($user, 'clinic')
                ->getJson($this->url())
                ->assertOk()
                ->assertJsonCount(2, 'data.data');

            $this->assertStringNotContainsString('Observação clínica', $response->getContent());
            $this->assertStringNotContainsString('Sala 2', $response->getContent());
        }
    }

    public function test_physio_who_never_attended_the_patient_gets_404(): void
    {
        $this->appointment($this->fulano, -7);

        $this->actingAs($this->outsider, 'clinic')
            ->getJson($this->url())
            ->assertNotFound();
    }

    public function test_physio_whose_only_appointment_was_cancelled_gets_404(): void
    {
        $this->appointment($this->fulano, -7);
        $this->appointment($this->sicrano, 2, ['status' => AppointmentStatus::Cancelled]);

        $this->actingAs($this->sicrano, 'clinic')
            ->getJson($this->url())
            ->assertNotFound();
    }

    public function test_patient_without_appointments_in_this_clinic_gets_404(): void
    {
        $this->actingAs($this->secretary, 'clinic')
            ->getJson($this->url())
            ->assertNotFound();
    }

    public function test_user_of_another_clinic_gets_404_for_our_patient(): void
    {
        $this->appointment($this->fulano, -7);
        $otherClinic = Clinic::factory()->create();
        $otherAdmin  = ClinicUser::factory()->create(['clinic_id' => $otherClinic->id, 'role' => ClinicUser::ROLE_ADMIN]);

        $this->actingAs($otherAdmin, 'clinic')
            ->getJson($this->url())
            ->assertNotFound();
    }

    public function test_physio_of_another_clinic_with_appointment_there_does_not_see_ours(): void
    {
        $this->appointment($this->fulano, -7);
        $otherClinic = Clinic::factory()->create();
        $otherPhysio = ClinicUser::factory()->create(['clinic_id' => $otherClinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        // Dado inconsistente de propósito: consulta da outra clínica com o nosso paciente.
        Appointment::factory()->create([
            'clinic_id'      => $otherClinic->id,
            'clinic_user_id' => $otherPhysio->id,
            'patient_id'     => $this->patient->id,
        ]);

        $response = $this->actingAs($otherPhysio, 'clinic')
            ->getJson($this->url())
            ->assertOk()
            ->assertJsonCount(1, 'data.data');

        $this->assertSame($otherPhysio->name, $response->json('data.data.0.clinic_user_name'));
    }

    public function test_history_is_paginated_from_most_recent(): void
    {
        $ids = [];
        foreach (range(1, 5) as $week) {
            $ids[] = $this->appointment($this->fulano, -7 * $week)->id;
        }

        $first = $this->actingAs($this->secretary, 'clinic')
            ->getJson($this->url() . '?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data.data')
            ->assertJsonPath('data.total', 5)
            ->assertJsonPath('data.per_page', 2)
            ->assertJsonPath('data.current_page', 1)
            ->assertJsonPath('data.last_page', 3);
        $this->assertSame([$ids[0], $ids[1]], array_column($first->json('data.data'), 'id'));

        $last = $this->actingAs($this->secretary, 'clinic')
            ->getJson($this->url() . '?per_page=2&page=3')
            ->assertOk()
            ->assertJsonCount(1, 'data.data');
        $this->assertSame([$ids[4]], array_column($last->json('data.data'), 'id'));
    }

    public function test_page_size_is_capped(): void
    {
        $this->appointment($this->fulano, -7);

        $this->actingAs($this->secretary, 'clinic')
            ->getJson($this->url())
            ->assertOk()
            ->assertJsonPath('data.per_page', 50);

        $this->actingAs($this->secretary, 'clinic')
            ->getJson($this->url() . '?per_page=500')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['per_page']);
    }

    public function test_unauthenticated_gets_401(): void
    {
        $this->getJson($this->url())->assertUnauthorized();
    }
}
