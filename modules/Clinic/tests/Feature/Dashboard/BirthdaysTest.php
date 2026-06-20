<?php

namespace Modules\Clinic\Tests\Feature\Dashboard;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class BirthdaysTest extends TestCase
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

    private function patientBornThisMonth(ClinicUser $physio, int $day, array $overrides = []): Patient
    {
        $birth = Carbon::now('UTC')->startOfMonth()->addDays($day - 1)->subYears(30);

        return Patient::factory()->create(array_merge([
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $physio->id,
            'birth_date'     => $birth->toDateString(),
        ], $overrides));
    }

    public function test_admin_sees_all_clinic_birthdays_ordered_by_day(): void
    {
        $this->patientBornThisMonth($this->physioA, 15);
        $this->patientBornThisMonth($this->physioB, 3);
        // Paciente nascido em outro mês não entra:
        Patient::factory()->create([
            'clinic_id'  => $this->clinic->id,
            'birth_date' => Carbon::now('UTC')->addMonths(2)->startOfMonth()->toDateString(),
        ]);

        $response = $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/dashboard')
            ->assertOk()
            ->assertJsonPath('data.birthdays.total', 2);

        $days = array_map(fn ($b) => $b['day'], $response->json('data.birthdays.items'));
        $this->assertSame([3, 15], $days);
    }

    public function test_physiotherapist_sees_only_own_patients_birthdays(): void
    {
        $this->patientBornThisMonth($this->physioA, 10);
        $this->patientBornThisMonth($this->physioB, 20);

        $this->actingAs($this->physioA, 'clinic')
            ->getJson('/api/clinic/dashboard')
            ->assertOk()
            ->assertJsonPath('data.birthdays.total', 1)
            ->assertJsonPath('data.birthdays.items.0.day', 10);
    }

    public function test_can_message_is_false_without_phone(): void
    {
        $this->patientBornThisMonth($this->physioA, 5, ['phone' => null]);

        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/dashboard')
            ->assertOk()
            ->assertJsonPath('data.birthdays.items.0.can_message', false);
    }
}
