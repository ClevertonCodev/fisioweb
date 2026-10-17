<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class ClinicUserPreferenceTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $physio;

    protected function setUp(): void
    {
        parent::setUp();

        $this->physio = ClinicUser::factory()->create(['role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
    }

    public function test_user_saves_and_reads_back_agenda_view(): void
    {
        $this->actingAs($this->physio, 'clinic')
            ->putJson('/api/clinic/me/preferences/agenda.view', ['value' => 'timeGridDay'])
            ->assertOk()
            ->assertJsonPath('data.key', 'agenda.view')
            ->assertJsonPath('data.value', 'timeGridDay');

        $this->actingAs($this->physio, 'clinic')
            ->getJson('/api/clinic/me/preferences?keys=agenda.view,agenda.show_weekends')
            ->assertOk()
            ->assertExactJson(['data' => ['agenda.view' => 'timeGridDay']]);
    }

    public function test_second_put_updates_instead_of_duplicating(): void
    {
        $this->actingAs($this->physio, 'clinic')
            ->putJson('/api/clinic/me/preferences/agenda.show_weekends', ['value' => true])
            ->assertOk();
        $this->actingAs($this->physio, 'clinic')
            ->putJson('/api/clinic/me/preferences/agenda.show_weekends', ['value' => false])
            ->assertOk()
            ->assertJsonPath('data.value', false);

        $this->assertDatabaseCount('clinic_user_preferences', 1);
        $this->actingAs($this->physio, 'clinic')
            ->getJson('/api/clinic/me/preferences?keys=agenda.show_weekends')
            ->assertExactJson(['data' => ['agenda.show_weekends' => false]]);
    }

    public function test_get_without_saved_values_returns_empty_object(): void
    {
        $this->actingAs($this->physio, 'clinic')
            ->getJson('/api/clinic/me/preferences?keys=agenda.view')
            ->assertOk()
            ->assertExactJson(['data' => []]);

        $this->assertSame('{"data":{}}', $this->actingAs($this->physio, 'clinic')
            ->getJson('/api/clinic/me/preferences?keys=agenda.view')
            ->getContent());
    }

    public function test_unknown_key_is_rejected_on_get_and_put(): void
    {
        $this->actingAs($this->physio, 'clinic')
            ->getJson('/api/clinic/me/preferences?keys=agenda.view,foo.bar')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['keys.1']);

        $this->actingAs($this->physio, 'clinic')
            ->getJson('/api/clinic/me/preferences')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['keys']);

        $this->actingAs($this->physio, 'clinic')
            ->putJson('/api/clinic/me/preferences/foo.bar', ['value' => 'x'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['key']);

        $this->assertDatabaseCount('clinic_user_preferences', 0);
    }

    public function test_invalid_values_are_rejected(): void
    {
        foreach (['xyz', '', null, 3] as $value) {
            $this->actingAs($this->physio, 'clinic')
                ->putJson('/api/clinic/me/preferences/agenda.view', ['value' => $value])
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['value']);
        }

        foreach (['1', 1, 'true', null] as $value) {
            $this->actingAs($this->physio, 'clinic')
                ->putJson('/api/clinic/me/preferences/agenda.show_weekends', ['value' => $value])
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['value']);
        }

        $this->actingAs($this->physio, 'clinic')
            ->putJson('/api/clinic/me/preferences/agenda.show_weekends', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['value']);

        $this->assertDatabaseCount('clinic_user_preferences', 0);
    }

    public function test_user_does_not_see_preference_of_another_user_of_same_clinic(): void
    {
        $secretary = ClinicUser::factory()->create([
            'clinic_id' => $this->physio->clinic_id,
            'role'      => ClinicUser::ROLE_SECRETARY,
        ]);

        $this->actingAs($this->physio, 'clinic')
            ->putJson('/api/clinic/me/preferences/agenda.view', ['value' => 'dayGridMonth'])
            ->assertOk();

        $this->actingAs($secretary, 'clinic')
            ->getJson('/api/clinic/me/preferences?keys=agenda.view')
            ->assertOk()
            ->assertExactJson(['data' => []]);

        $this->actingAs($secretary, 'clinic')
            ->putJson('/api/clinic/me/preferences/agenda.view', ['value' => 'listWeek'])
            ->assertOk();

        $this->actingAs($this->physio, 'clinic')
            ->getJson('/api/clinic/me/preferences?keys=agenda.view')
            ->assertExactJson(['data' => ['agenda.view' => 'dayGridMonth']]);
        $this->assertDatabaseHas('clinic_user_preferences', [
            'clinic_user_id' => $secretary->id,
            'clinic_id'      => $this->physio->clinic_id,
            'key'            => 'agenda.view',
        ]);
    }

    public function test_user_of_another_clinic_neither_sees_nor_changes_preferences(): void
    {
        $otherClinic = Clinic::factory()->create();
        $otherAdmin  = ClinicUser::factory()->create(['clinic_id' => $otherClinic->id]);

        $this->actingAs($this->physio, 'clinic')
            ->putJson('/api/clinic/me/preferences/agenda.view', ['value' => 'timeGridDay'])
            ->assertOk();

        $this->actingAs($otherAdmin, 'clinic')
            ->getJson('/api/clinic/me/preferences?keys=agenda.view')
            ->assertOk()
            ->assertExactJson(['data' => []]);

        $this->actingAs($otherAdmin, 'clinic')
            ->putJson('/api/clinic/me/preferences/agenda.view', ['value' => 'listWeek'])
            ->assertOk();

        $this->actingAs($this->physio, 'clinic')
            ->getJson('/api/clinic/me/preferences?keys=agenda.view')
            ->assertExactJson(['data' => ['agenda.view' => 'timeGridDay']]);
        $this->assertDatabaseHas('clinic_user_preferences', [
            'clinic_user_id' => $otherAdmin->id,
            'clinic_id'      => $otherClinic->id,
        ]);
    }

    public function test_unauthenticated_gets_401(): void
    {
        $this->getJson('/api/clinic/me/preferences?keys=agenda.view')->assertUnauthorized();
        $this->putJson('/api/clinic/me/preferences/agenda.view', ['value' => 'timeGridDay'])->assertUnauthorized();
    }
}
