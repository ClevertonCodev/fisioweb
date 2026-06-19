<?php

namespace Modules\Clinic\Tests\Feature\Dashboard;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class OccupancyRateTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    private ClinicUser $physioA;

    private ClinicUser $physioB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinic  = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->admin   = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $this->physioA = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->physioB = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
    }

    public function test_admin_can_choose_any_professional(): void
    {
        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/dashboard/occupancy-rate?granularity=daily&clinic_user_id=' . $this->physioB->id)
            ->assertOk()
            ->assertJsonPath('data.clinic_user_id', $this->physioB->id)
            ->assertJsonPath('data.granularity', 'daily');
    }

    public function test_physiotherapist_is_forced_to_self(): void
    {
        // Mesmo pedindo o id de outro fisio, o backend força o próprio (SC-004).
        $this->actingAs($this->physioA, 'clinic')
            ->getJson('/api/clinic/dashboard/occupancy-rate?granularity=weekly&clinic_user_id=' . $this->physioB->id)
            ->assertOk()
            ->assertJsonPath('data.clinic_user_id', $this->physioA->id);
    }

    public function test_invalid_granularity_is_rejected(): void
    {
        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/dashboard/occupancy-rate?granularity=yearly')
            ->assertStatus(422);
    }

    public function test_does_not_accept_professional_from_another_clinic(): void
    {
        $otherClinic = Clinic::factory()->create();
        $otherUser   = ClinicUser::factory()->create(['clinic_id' => $otherClinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);

        // clinic_user_id de outra clínica é ignorado → cai no fallback (o próprio admin).
        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/dashboard/occupancy-rate?granularity=daily&clinic_user_id=' . $otherUser->id)
            ->assertOk()
            ->assertJsonPath('data.clinic_user_id', $this->admin->id);
    }
}
