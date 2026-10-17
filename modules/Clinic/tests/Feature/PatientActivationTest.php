<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Contracts\PatientServiceInterface;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PatientActivationTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    private ClinicUser $secretary;

    private ClinicUser $physiotherapist;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinic          = Clinic::factory()->create();
        $this->admin           = $this->userWithRole(ClinicUser::ROLE_ADMIN);
        $this->secretary       = $this->userWithRole(ClinicUser::ROLE_SECRETARY);
        $this->physiotherapist = $this->userWithRole(ClinicUser::ROLE_PHYSIOTHERAPIST);
    }

    public function test_update_ignores_is_active_for_every_role(): void
    {
        foreach ([$this->physiotherapist, $this->secretary, $this->admin] as $user) {
            $patient = $this->patient(['is_active' => true]);

            $this->actingAs($user, 'clinic')
                ->putJson("/api/clinic/patients/{$patient->id}", ['name' => 'Nome Novo', 'is_active' => false])
                ->assertOk();

            $this->assertDatabaseHas('patients', ['id' => $patient->id, 'name' => 'Nome Novo', 'is_active' => true]);
        }
    }

    public function test_update_does_not_reactivate_inactive_patient(): void
    {
        $patient = $this->patient(['is_active' => false]);

        $this->actingAs($this->physiotherapist, 'clinic')
            ->putJson("/api/clinic/patients/{$patient->id}", ['name' => 'Nome Novo', 'is_active' => true])
            ->assertOk();

        $this->assertDatabaseHas('patients', ['id' => $patient->id, 'is_active' => false]);
    }

    public function test_store_ignores_is_active_and_creates_active_patient(): void
    {
        $this->actingAs($this->physiotherapist, 'clinic')
            ->postJson('/api/clinic/patients', [
                'name'       => 'Paciente Novo',
                'email'      => 'paciente.novo@exemplo.com',
                'cpf'        => '11144477735',
                'phone'      => '21987654321',
                'birth_date' => now()->subYears(30)->toDateString(),
                'is_foreign' => false,
                'status'     => 'em_tratamento',
                'is_active'  => false,
            ])
            ->assertCreated();

        $this->assertDatabaseHas('patients', ['email' => 'paciente.novo@exemplo.com', 'is_active' => true]);
    }

    public function test_secretary_and_admin_reactivate_inactive_patient(): void
    {
        foreach ([$this->secretary, $this->admin] as $user) {
            $patient = $this->patient(['is_active' => false]);

            $this->actingAs($user, 'clinic')
                ->postJson("/api/clinic/patients/{$patient->id}/reactivate")
                ->assertOk()
                ->assertJsonPath('data.id', $patient->id)
                ->assertJsonPath('data.is_active', true);

            $this->assertDatabaseHas('patients', ['id' => $patient->id, 'is_active' => true]);
        }
    }

    public function test_physiotherapist_cannot_reactivate(): void
    {
        $patient = $this->patient(['is_active' => false]);

        $this->actingAs($this->physiotherapist, 'clinic')
            ->postJson("/api/clinic/patients/{$patient->id}/reactivate")
            ->assertForbidden();

        $this->assertDatabaseHas('patients', ['id' => $patient->id, 'is_active' => false]);
    }

    public function test_reactivate_unknown_patient_returns404(): void
    {
        $this->actingAs($this->admin, 'clinic')
            ->postJson('/api/clinic/patients/999999/reactivate')
            ->assertNotFound();
    }

    public function test_unauthenticated_cannot_reactivate(): void
    {
        $patient = $this->patient(['is_active' => false]);

        $this->postJson("/api/clinic/patients/{$patient->id}/reactivate")
            ->assertUnauthorized();

        $this->assertDatabaseHas('patients', ['id' => $patient->id, 'is_active' => false]);
    }

    public function test_reactivate_active_patient_keeps_it_active(): void
    {
        $patient = $this->patient(['is_active' => true]);

        $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/patients/{$patient->id}/reactivate")
            ->assertOk()
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('patients', ['id' => $patient->id, 'is_active' => true]);
    }

    public function test_reactivate_returns404_when_patient_disappears_meanwhile(): void
    {
        // Corrida: o paciente é apagado entre a checagem do controller e o update.
        $patient = $this->patient(['is_active' => false]);
        $this->mock(PatientServiceInterface::class, function (MockInterface $mock) use ($patient) {
            $mock->shouldReceive('find')->with($patient->id)->andReturn($patient);
            $mock->shouldReceive('reactivate')->andReturnNull();
        });

        $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/patients/{$patient->id}/reactivate")
            ->assertNotFound()
            ->assertJsonMissingPath('data');
    }

    private function userWithRole(string $role): ClinicUser
    {
        return ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => $role]);
    }

    private function patient(array $attributes = []): Patient
    {
        return Patient::factory()->create(array_merge([
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $this->admin->id,
        ], $attributes));
    }
}
