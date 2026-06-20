<?php

namespace Modules\Clinic\Tests\Feature\Dashboard;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\Clinic\Enums\ActivityType;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class ActivitiesTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    private ClinicUser $physio;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();

        $this->clinic = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->admin  = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $this->physio = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
    }

    public function test_creating_a_patient_records_an_activity_listed_in_the_feed(): void
    {
        // Cria um paciente via service (gera atividade) autenticado como admin.
        $this->actingAs($this->admin, 'clinic');
        app(\Modules\Patient\Contracts\PatientServiceInterface::class)->create([
            'name'  => 'Maria Silva',
            'email' => 'maria@example.com',
        ], $this->clinic->id);

        $response = $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/dashboard/activities')
            ->assertOk()
            ->assertJsonPath('data.items.0.type', ActivityType::PatientCreated->value);

        $this->assertStringContainsString('Maria Silva', $response->json('data.items.0.description'));
    }

    public function test_physiotherapist_cannot_view_activities(): void
    {
        $this->actingAs($this->physio, 'clinic')
            ->getJson('/api/clinic/dashboard/activities')
            ->assertStatus(403);
    }

    public function test_empty_feed_when_no_activity_today(): void
    {
        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/dashboard/activities')
            ->assertOk()
            ->assertJsonPath('data.items', []);
    }
}
