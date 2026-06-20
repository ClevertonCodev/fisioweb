<?php

namespace Modules\Clinic\Tests\Feature\Dashboard;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PatientAcquisitionTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    private ClinicUser $physioA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinic  = Clinic::factory()->create(['timezone' => 'UTC']);
        $this->admin   = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $this->physioA = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
    }

    private function patient(array $overrides = []): Patient
    {
        return Patient::factory()->create(array_merge([
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $this->physioA->id,
        ], $overrides));
    }

    public function test_groups_by_source_over_three_years_with_consolidated_total(): void
    {
        $currentYear = Carbon::now('UTC')->year;

        $this->patient(['referral_source' => 'google', 'created_at' => Carbon::create($currentYear, 6, 1)]);
        $this->patient(['referral_source' => 'google', 'created_at' => Carbon::create($currentYear - 1, 6, 1)]);
        $this->patient(['referral_source' => null, 'created_at' => Carbon::create($currentYear - 2, 6, 1)]);
        // Fora da janela de 3 anos — ignorado:
        $this->patient(['referral_source' => 'google', 'created_at' => Carbon::create($currentYear - 5, 6, 1)]);

        $response = $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/dashboard/patient-acquisition')
            ->assertOk()
            ->assertJsonPath('data.years', [$currentYear, $currentYear - 1, $currentYear - 2]);

        $sources = collect($response->json('data.sources'));
        $google  = $sources->firstWhere('source', 'google');
        $this->assertSame(2, $google['total']);

        $naoInformado = $sources->firstWhere('source', 'Não informado');
        $this->assertSame(1, $naoInformado['total']);
    }

    public function test_physiotherapist_sees_only_own_patients(): void
    {
        $other = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->patient(['referral_source' => 'google']);
        Patient::factory()->create([
            'clinic_id'       => $this->clinic->id,
            'clinic_user_id'  => $other->id,
            'referral_source' => 'convenio',
        ]);

        $response = $this->actingAs($this->physioA, 'clinic')
            ->getJson('/api/clinic/dashboard/patient-acquisition')
            ->assertOk();

        $sources = collect($response->json('data.sources'))->pluck('source');
        $this->assertContains('google', $sources);
        $this->assertNotContains('convenio', $sources);
    }
}
