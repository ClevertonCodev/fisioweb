<?php

namespace Modules\TreatmentProgram\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\ClinicUser;
use Modules\TreatmentProgram\Models\ClinicProgramDraft;
use Tests\TestCase;

class ProgramDraftControllerTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $clinicUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->clinicUser = ClinicUser::factory()->create();
    }

    public function test_unauthenticated_cannot_access_program_drafts_endpoints(): void
    {
        $payload = $this->validPayload();

        $this->getJson('/api/clinic/program-drafts')->assertUnauthorized();
        $this->putJson('/api/clinic/program-drafts', $payload)->assertUnauthorized();
        $this->deleteJson('/api/clinic/program-drafts')->assertUnauthorized();
    }

    public function test_show_returns_null_when_user_has_no_draft(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->getJson('/api/clinic/program-drafts')
            ->assertOk()
            ->assertJson(['data' => null]);
    }

    public function test_upsert_creates_draft_for_authenticated_user_and_show_returns_it(): void
    {
        $payload = $this->validPayload();

        $this->actingAs($this->clinicUser, 'clinic')
            ->putJson('/api/clinic/program-drafts', $payload)
            ->assertOk()
            ->assertJsonPath('message', 'Rascunho salvo.');

        $this->assertDatabaseHas('clinic_program_drafts', [
            'clinic_id'      => $this->clinicUser->clinic_id,
            'clinic_user_id' => $this->clinicUser->id,
        ]);

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->getJson('/api/clinic/program-drafts');

        $response->assertOk()
            ->assertJsonPath('data.step', $payload['step'])
            ->assertJsonPath('data.selectedIds.0', $payload['selectedIds'][0])
            ->assertJsonPath('data.savedAt', $payload['savedAt']);
    }

    public function test_upsert_updates_existing_draft_instead_of_creating_duplicate(): void
    {
        ClinicProgramDraft::create([
            'clinic_id'      => $this->clinicUser->clinic_id,
            'clinic_user_id' => $this->clinicUser->id,
            'draft_data'     => [
                'step'        => 1,
                'selectedIds' => [],
                'groups'      => [],
                'savedAt'     => 1000,
            ],
        ]);

        $updatedPayload = $this->validPayload([
            'step'        => 4,
            'selectedIds' => ['ex-9'],
            'savedAt'     => 9999,
        ]);

        $this->actingAs($this->clinicUser, 'clinic')
            ->putJson('/api/clinic/program-drafts', $updatedPayload)
            ->assertOk();

        $this->assertDatabaseCount('clinic_program_drafts', 1);

        $draft = ClinicProgramDraft::where('clinic_user_id', $this->clinicUser->id)->first();
        $this->assertNotNull($draft);
        $this->assertSame(4, $draft->draft_data['step']);
        $this->assertSame(['ex-9'], $draft->draft_data['selectedIds']);
        $this->assertSame(9999, $draft->draft_data['savedAt']);
    }

    public function test_show_and_destroy_are_isolated_by_clinic_user_id(): void
    {
        $otherUser = ClinicUser::factory()->create([
            'clinic_id' => $this->clinicUser->clinic_id,
        ]);

        ClinicProgramDraft::create([
            'clinic_id'      => $otherUser->clinic_id,
            'clinic_user_id' => $otherUser->id,
            'draft_data'     => $this->validPayload(['step' => 3, 'savedAt' => 3000]),
        ]);

        $this->actingAs($this->clinicUser, 'clinic')
            ->getJson('/api/clinic/program-drafts')
            ->assertOk()
            ->assertJson(['data' => null]);

        $this->actingAs($this->clinicUser, 'clinic')
            ->deleteJson('/api/clinic/program-drafts')
            ->assertOk()
            ->assertJsonPath('message', 'Rascunho descartado.');

        $this->assertDatabaseCount('clinic_program_drafts', 1);
        $this->assertDatabaseHas('clinic_program_drafts', [
            'clinic_user_id' => $otherUser->id,
        ]);
    }

    public function test_upsert_validates_required_fields_and_step_range(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->putJson('/api/clinic/program-drafts', [
                'step'        => 9,
                'savedAt'     => 'invalid',
                'groups'      => 'invalid',
                'selectedIds' => [1],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['step', 'savedAt', 'groups', 'selectedIds.0']);
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'step'        => 2,
            'selectedIds' => ['ex-1', 'ex-2'],
            'groups'      => [
                [
                    'id'        => 'group-1',
                    'name'      => 'Grupo 1',
                    'exercises' => [],
                ],
            ],
            'savedAt'     => 1711840000000,
        ], $overrides);
    }
}
