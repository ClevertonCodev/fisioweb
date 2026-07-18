<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class ProfessionalsListTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    private ClinicUser $physio;

    private ClinicUser $secretary;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinic    = Clinic::factory()->create();
        $this->admin     = ClinicUser::factory()->create([
            'clinic_id' => $this->clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
            'name'      => 'Admin Atendente',
            'status'    => ClinicUser::STATUS_ACTIVE,
        ]);
        $this->physio    = ClinicUser::factory()->create([
            'clinic_id' => $this->clinic->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
            'name'      => 'Dra. Ana',
            'status'    => ClinicUser::STATUS_ACTIVE,
        ]);
        $this->secretary = ClinicUser::factory()->create([
            'clinic_id' => $this->clinic->id,
            'role'      => ClinicUser::ROLE_SECRETARY,
            'name'      => 'Secretária',
            'status'    => ClinicUser::STATUS_ACTIVE,
        ]);
    }

    public function test_admin_sees_admin_and_physiotherapists_as_professionals(): void
    {
        $this->physio->forceFill([
            'photo_url' => 'https://cdn.example.com/physio.jpg',
        ])->save();

        $response = $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/users/professionals')
            ->assertOk()
            ->assertJsonStructure(['data' => [['id', 'name', 'photo_url']]]);

        $ids = collect($response->json('data'))->pluck('id')->all();

        $this->assertContains($this->admin->id, $ids);
        $this->assertContains($this->physio->id, $ids);
        $this->assertNotContains($this->secretary->id, $ids);
        $this->assertSame(
            'https://cdn.example.com/physio.jpg',
            collect($response->json('data'))->firstWhere('id', $this->physio->id)['photo_url'],
        );
    }

    public function test_secretary_sees_admin_and_physiotherapists_as_professionals(): void
    {
        $response = $this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/users/professionals')
            ->assertOk();

        $ids = collect($response->json('data'))->pluck('id')->all();

        $this->assertContains($this->admin->id, $ids);
        $this->assertContains($this->physio->id, $ids);
        $this->assertNotContains($this->secretary->id, $ids);
    }

    public function test_physiotherapist_sees_only_self(): void
    {
        $response = $this->actingAs($this->physio, 'clinic')
            ->getJson('/api/clinic/users/professionals')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->assertSame($this->physio->id, $response->json('data.0.id'));
    }

    public function test_inactive_professionals_are_excluded(): void
    {
        $inactiveAdmin = ClinicUser::factory()->create([
            'clinic_id' => $this->clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
            'status'    => ClinicUser::STATUS_INACTIVE,
        ]);

        $response = $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/users/professionals')
            ->assertOk();

        $ids = collect($response->json('data'))->pluck('id')->all();

        $this->assertNotContains($inactiveAdmin->id, $ids);
    }
}
