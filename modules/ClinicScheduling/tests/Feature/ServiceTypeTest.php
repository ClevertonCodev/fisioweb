<?php

namespace Modules\ClinicScheduling\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class ServiceTypeTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    private ClinicUser $secretary;

    private ClinicUser $physio;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinic    = Clinic::factory()->create();
        $this->admin     = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $this->secretary = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $this->physio    = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
    }

    /**
     * @return list<array{name: string, duration_minutes: int}>
     */
    private function namesAndDurations(array $data): array
    {
        return array_map(
            fn (array $item) => ['name' => $item['name'], 'duration_minutes' => $item['duration_minutes']],
            $data,
        );
    }

    public function test_first_read_creates_the_five_default_types_in_order(): void
    {
        $response = $this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/service-types')
            ->assertOk();

        $this->assertSame([
            ['name' => 'Avaliação', 'duration_minutes' => 60],
            ['name' => 'Sessão', 'duration_minutes' => 45],
            ['name' => 'Retorno', 'duration_minutes' => 30],
            ['name' => 'Reavaliação', 'duration_minutes' => 60],
            ['name' => 'Sessão de Pilates', 'duration_minutes' => 60],
        ], $this->namesAndDurations($response->json('data')));
        $this->assertSame([0, 1, 2, 3, 4], array_column($response->json('data'), 'position'));

        $this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/service-types')
            ->assertOk()
            ->assertJsonCount(5, 'data');
        $this->assertDatabaseCount('clinic_service_types', 5);
    }

    public function test_all_roles_can_read_the_types(): void
    {
        foreach ([$this->admin, $this->secretary, $this->physio] as $user) {
            $this->actingAs($user, 'clinic')
                ->getJson('/api/clinic/service-types')
                ->assertOk()
                ->assertJsonCount(5, 'data');
        }
    }

    public function test_other_clinic_gets_its_own_types_and_never_sees_ours(): void
    {
        $ours = $this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/service-types')
            ->json('data');

        $otherClinic = Clinic::factory()->create();
        $otherAdmin  = ClinicUser::factory()->create(['clinic_id' => $otherClinic->id]);

        $theirs = $this->actingAs($otherAdmin, 'clinic')
            ->getJson('/api/clinic/service-types')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->json('data');

        $this->assertEmpty(array_intersect(array_column($ours, 'id'), array_column($theirs, 'id')));
    }

    public function test_unauthenticated_gets_401(): void
    {
        $this->getJson('/api/clinic/service-types')->assertUnauthorized();
        $this->putJson('/api/clinic/service-types', ['items' => []])->assertUnauthorized();
    }

    public function test_replace_creates_renames_reorders_and_removes(): void
    {
        $types = collect($this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/service-types')
            ->json('data'))->keyBy('name');

        $response = $this->actingAs($this->secretary, 'clinic')
            ->putJson('/api/clinic/service-types', ['items' => [
                ['id' => $types['Sessão']['id'], 'name' => 'Sessão individual', 'duration_minutes' => 50],
                ['id'   => $types['Avaliação']['id'], 'name' => 'Avaliação', 'duration_minutes' => 60],
                ['name' => 'Hidroterapia', 'duration_minutes' => 40],
            ]])
            ->assertOk();

        $this->assertSame([
            ['name' => 'Sessão individual', 'duration_minutes' => 50],
            ['name' => 'Avaliação', 'duration_minutes' => 60],
            ['name' => 'Hidroterapia', 'duration_minutes' => 40],
        ], $this->namesAndDurations($response->json('data')));
        $this->assertSame($types['Sessão']['id'], $response->json('data.0.id'));
        $this->assertSame([0, 1, 2], array_column($response->json('data'), 'position'));

        $this->actingAs($this->physio, 'clinic')
            ->getJson('/api/clinic/service-types')
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.name', 'Sessão individual');
        $this->assertSoftDeleted('clinic_service_types', ['id' => $types['Retorno']['id']]);
    }

    public function test_empty_list_is_kept_and_defaults_do_not_come_back(): void
    {
        $this->actingAs($this->admin, 'clinic')->getJson('/api/clinic/service-types')->assertOk();

        $this->actingAs($this->admin, 'clinic')
            ->putJson('/api/clinic/service-types', ['items' => []])
            ->assertOk()
            ->assertExactJson(['data' => []]);

        $this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/service-types')
            ->assertOk()
            ->assertExactJson(['data' => []]);
        $this->assertDatabaseCount('clinic_service_types', 5);
    }

    public function test_empty_list_before_any_read_also_keeps_defaults_away(): void
    {
        $this->actingAs($this->admin, 'clinic')
            ->putJson('/api/clinic/service-types', ['items' => []])
            ->assertOk()
            ->assertExactJson(['data' => []]);

        $this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/service-types')
            ->assertOk()
            ->assertExactJson(['data' => []]);
    }

    public function test_replace_validates_names_durations_and_size(): void
    {
        $cases = [
            [['name' => 'Sessão', 'duration_minutes' => 30], ['name' => 'sessão', 'duration_minutes' => 45]],
            [['name' => 'Curta', 'duration_minutes' => 4]],
            [['name' => 'Longa', 'duration_minutes' => 481]],
            [['name' => '', 'duration_minutes' => 30]],
            [['name' => str_repeat('a', 101), 'duration_minutes' => 30]],
            array_map(fn ($i) => ['name' => "Tipo {$i}", 'duration_minutes' => 30], range(1, 31)),
        ];

        foreach ($cases as $items) {
            $this->actingAs($this->secretary, 'clinic')
                ->putJson('/api/clinic/service-types', ['items' => $items])
                ->assertUnprocessable();
        }

        $this->actingAs($this->secretary, 'clinic')
            ->putJson('/api/clinic/service-types', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['items']);

        $this->assertDatabaseCount('clinic_service_types', 0);
    }

    public function test_physiotherapist_cannot_replace_the_list(): void
    {
        $this->actingAs($this->physio, 'clinic')->getJson('/api/clinic/service-types')->assertOk();

        $this->actingAs($this->physio, 'clinic')
            ->putJson('/api/clinic/service-types', ['items' => []])
            ->assertForbidden();

        $this->actingAs($this->physio, 'clinic')
            ->getJson('/api/clinic/service-types')
            ->assertJsonCount(5, 'data');
    }

    public function test_admin_and_secretary_can_replace_the_list(): void
    {
        foreach ([$this->admin, $this->secretary] as $user) {
            $this->actingAs($user, 'clinic')
                ->putJson('/api/clinic/service-types', ['items' => [
                    ['name' => "Tipo de {$user->role}", 'duration_minutes' => 30],
                ]])
                ->assertOk()
                ->assertJsonPath('data.0.name', "Tipo de {$user->role}");
        }
    }

    public function test_id_from_another_clinic_is_rejected_and_left_untouched(): void
    {
        $otherClinic = Clinic::factory()->create();
        $otherAdmin  = ClinicUser::factory()->create(['clinic_id' => $otherClinic->id]);
        $theirs      = $this->actingAs($otherAdmin, 'clinic')
            ->getJson('/api/clinic/service-types')
            ->json('data.0');

        $this->actingAs($this->secretary, 'clinic')
            ->putJson('/api/clinic/service-types', ['items' => [
                ['id' => $theirs['id'], 'name' => 'Roubado', 'duration_minutes' => 30],
            ]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['items.0.id']);

        $this->assertDatabaseHas('clinic_service_types', [
            'id'         => $theirs['id'],
            'clinic_id'  => $otherClinic->id,
            'name'       => $theirs['name'],
            'deleted_at' => null,
        ]);
        $this->actingAs($otherAdmin, 'clinic')
            ->getJson('/api/clinic/service-types')
            ->assertJsonCount(5, 'data');
    }

    public function test_replacing_our_list_never_deletes_types_of_another_clinic(): void
    {
        $otherClinic = Clinic::factory()->create();
        $otherAdmin  = ClinicUser::factory()->create(['clinic_id' => $otherClinic->id]);
        $this->actingAs($otherAdmin, 'clinic')->getJson('/api/clinic/service-types')->assertJsonCount(5, 'data');
        $this->actingAs($this->secretary, 'clinic')->getJson('/api/clinic/service-types')->assertOk();

        $this->actingAs($this->secretary, 'clinic')
            ->putJson('/api/clinic/service-types', ['items' => [
                ['name' => 'Só nosso', 'duration_minutes' => 30],
            ]])
            ->assertOk();

        $this->actingAs($otherAdmin, 'clinic')
            ->getJson('/api/clinic/service-types')
            ->assertJsonCount(5, 'data');
    }

    public function test_deleted_id_of_own_clinic_is_rejected(): void
    {
        $retorno = collect($this->actingAs($this->secretary, 'clinic')
            ->getJson('/api/clinic/service-types')
            ->json('data'))->firstWhere('name', 'Retorno');

        $this->actingAs($this->secretary, 'clinic')
            ->putJson('/api/clinic/service-types', ['items' => []])
            ->assertOk();

        $this->actingAs($this->secretary, 'clinic')
            ->putJson('/api/clinic/service-types', ['items' => [
                ['id' => $retorno['id'], 'name' => 'Retorno', 'duration_minutes' => 30],
            ]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['items.0.id']);
    }
}
