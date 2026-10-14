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

    private function validPayload(): array
    {
        return [
            'name'        => 'Clínica A Atualizada',
            'email'       => 'contato-a@example.com',
            'document'    => '11222333000181',
            'type_person' => Clinic::TYPE_PERSON_JURIDICA,
            'status'      => Clinic::STATUS_ACTIVE,
        ];
    }
}
