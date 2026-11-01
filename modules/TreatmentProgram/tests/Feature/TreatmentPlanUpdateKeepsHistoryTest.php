<?php

namespace Modules\TreatmentProgram\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\Admin\Models\Exercise;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Models\TreatmentPlanExecutionSeries;
use Modules\TreatmentProgram\Models\TreatmentPlanExercise;
use Modules\TreatmentProgram\Models\TreatmentPlanGroup;
use Modules\TreatmentProgram\Tests\Support\CreatesPatientProgramFixtures;
use Tests\TestCase;

/**
 * Editar um programa não pode apagar o que o paciente já registrou: o PUT
 * sincroniza grupos e exercícios pelo id (ADR 025).
 */
class TreatmentPlanUpdateKeepsHistoryTest extends TestCase
{
    use CreatesPatientProgramFixtures;
    use RefreshDatabase;

    private Patient $patient;

    private TreatmentPlan $plan;

    private TreatmentPlanGroup $group;

    private TreatmentPlanExercise $squat;

    private TreatmentPlanExercise $bridge;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
        $this->setUpPatientProgramFixtures();

        $this->patient = $this->createPatient();
        [
            'plan'         => $this->plan,
            'group'        => $this->group,
            'planExercise' => $this->squat,
        ] = $this->createActiveProgram($this->patient);

        $this->bridge = TreatmentPlanExercise::create([
            'treatment_plan_id'       => $this->plan->id,
            'treatment_plan_group_id' => $this->group->id,
            'exercise_id'             => $this->newCatalogExercise('Ponte')->id,
            'sets_min'                => 2,
            'sets_max'                => 2,
            'repetitions_min'         => 15,
            'repetitions_max'         => 15,
            'sort_order'              => 1,
        ]);
    }

    public function test_changing_dose_keeps_exercise_and_patient_series(): void
    {
        $this->registerSeries($this->squat);
        $this->registerSeries($this->bridge);

        $payload                                    = $this->currentPayload();
        $payload['exercises'][0]['repetitions_min'] = 20;
        $payload['exercises'][0]['repetitions_max'] = 20;

        $this->putPlan($payload)->assertOk();

        $squat = TreatmentPlanExercise::find($this->squat->id);
        $this->assertNotNull($squat, 'o exercício editado deve continuar com o mesmo id');
        $this->assertSame(20, $squat->repetitions_min);
        $this->assertSame(1, $this->seriesCountOf($this->squat));
        $this->assertSame(1, $this->seriesCountOf($this->bridge));
    }

    public function test_removing_exercise_deletes_only_its_series(): void
    {
        $this->registerSeries($this->squat);
        $this->registerSeries($this->bridge);

        $payload = $this->currentPayload();
        array_pop($payload['exercises']);

        $this->putPlan($payload)->assertOk();

        $this->assertNull(TreatmentPlanExercise::find($this->bridge->id));
        $this->assertSame(0, $this->seriesCountOf($this->bridge));
        $this->assertNotNull(TreatmentPlanExercise::find($this->squat->id));
        $this->assertSame(1, $this->seriesCountOf($this->squat));
    }

    public function test_reordering_and_moving_between_groups_keeps_ids_and_series(): void
    {
        $this->registerSeries($this->squat);

        $payload           = $this->currentPayload();
        $payload['groups'] = [
            ['id' => $this->group->id, 'name' => 'Fortalecimento', 'sort_order' => 0],
            ['name' => 'Alongamento', 'sort_order' => 1],
        ];
        $payload['exercises'] = [
            $this->exercisePayload($this->bridge, 0),
            $this->exercisePayload($this->squat, 1),
        ];

        $this->putPlan($payload)->assertOk();

        $group = TreatmentPlanGroup::find($this->group->id);
        $this->assertNotNull($group, 'o grupo renomeado deve continuar com o mesmo id');
        $this->assertSame('Fortalecimento', $group->name);

        $squat  = TreatmentPlanExercise::find($this->squat->id);
        $bridge = TreatmentPlanExercise::find($this->bridge->id);
        $this->assertNotNull($squat);
        $this->assertNotNull($bridge);
        $this->assertSame(0, $bridge->sort_order);
        $this->assertSame(1, $squat->sort_order);
        $this->assertSame($this->group->id, $bridge->treatment_plan_group_id);
        $this->assertNotSame($this->group->id, $squat->treatment_plan_group_id);
        $this->assertSame('Alongamento', $squat->group->name);
        $this->assertSame(1, $this->seriesCountOf($this->squat));
    }

    public function test_ids_from_another_plan_are_rejected_and_nothing_changes(): void
    {
        ['plan' => $other, 'group' => $otherGroup, 'planExercise' => $otherExercise] =
            $this->createActiveProgram($this->createPatient());

        $withForeignExercise                       = $this->currentPayload();
        $withForeignExercise['title']              = 'Não deve gravar';
        $withForeignExercise['exercises'][1]['id'] = $otherExercise->id;
        $this->putPlan($withForeignExercise)
            ->assertStatus(422)
            ->assertJsonValidationErrors('exercises.1.id');

        $withForeignGroup                     = $this->currentPayload();
        $withForeignGroup['groups'][0]['id']  = $otherGroup->id;
        $this->putPlan($withForeignGroup)
            ->assertStatus(422)
            ->assertJsonValidationErrors('groups.0.id');

        $this->assertSame($this->plan->title, $this->plan->fresh()->title);
        $this->assertNotNull(TreatmentPlanExercise::find($this->bridge->id));
        $this->assertSame($other->id, $otherExercise->fresh()->treatment_plan_id);
        $this->assertSame($other->id, $otherGroup->fresh()->treatment_plan_id);
    }

    public function test_id_with_a_different_catalog_exercise_is_rejected(): void
    {
        $payload                                = $this->currentPayload();
        $payload['exercises'][0]['exercise_id'] = $this->bridge->exercise_id;

        $this->putPlan($payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors('exercises.0.id');

        $this->assertSame($this->squat->exercise_id, $this->squat->fresh()->exercise_id);
    }

    public function test_payload_without_ids_still_replaces_everything_like_before(): void
    {
        $payload = $this->currentPayload();
        unset($payload['groups'][0]['id'], $payload['exercises'][0]['id'], $payload['exercises'][1]['id']);

        $this->putPlan($payload)->assertOk()->assertJsonCount(2, 'data.exercises');

        $this->assertNull(TreatmentPlanExercise::find($this->squat->id));
        $this->assertSame(2, $this->plan->exercises()->count());
        $this->assertSame(1, $this->plan->groups()->count());
    }

    public function test_another_clinic_cannot_edit_even_with_the_right_ids(): void
    {
        $this->registerSeries($this->squat);
        $outsider = ClinicUser::factory()->create(['clinic_id' => Clinic::factory()->create()->id]);

        $payload          = $this->currentPayload();
        $payload['title'] = 'Invasão';
        array_pop($payload['exercises']);

        $this->actingAs($outsider, 'clinic')
            ->putJson("/api/clinic/treatment-plans/{$this->plan->id}", $payload)
            ->assertNotFound();

        $this->assertSame($this->plan->title, $this->plan->fresh()->title);
        $this->assertNotNull(TreatmentPlanExercise::find($this->bridge->id));
        $this->assertSame(1, $this->seriesCountOf($this->squat));
    }

    public function test_clearing_fields_on_an_existing_exercise_saves_them_empty(): void
    {
        $payload                                 = $this->currentPayload();
        $payload['exercises'][0]['days_of_week'] = null;
        $payload['exercises'][0]['period']       = null;
        $payload['exercises'][0]['notes']        = null;

        $this->putPlan($payload)->assertOk();

        $squat = $this->squat->fresh();
        $this->assertNull($squat->notes);
        $this->assertNull($squat->period);
        $this->assertNull($squat->days_of_week);
        $this->assertNull($squat->load_min);
        $this->assertNull($squat->load_max);
    }

    public function test_reordering_existing_groups_keeps_their_ids(): void
    {
        $second = TreatmentPlanGroup::create([
            'treatment_plan_id' => $this->plan->id,
            'name'              => 'Alongamento',
            'sort_order'        => 1,
        ]);

        $payload           = $this->currentPayload();
        $payload['groups'] = [
            ['id' => $second->id, 'name' => 'Alongamento', 'sort_order' => 0],
            ['id' => $this->group->id, 'name' => $this->group->name, 'sort_order' => 1],
        ];
        $payload['exercises'] = [
            $this->exercisePayload($this->squat, 1),
            $this->exercisePayload($this->bridge, 1),
        ];

        $this->putPlan($payload)->assertOk();

        $this->assertSame(0, $second->fresh()->sort_order);
        $this->assertSame(1, $this->group->fresh()->sort_order);
        $this->assertSame($this->group->id, $this->squat->fresh()->treatment_plan_group_id);
    }

    public function test_ids_from_a_plan_of_another_clinic_are_rejected(): void
    {
        $otherClinic   = Clinic::factory()->create();
        $otherPlan     = TreatmentPlan::create(['clinic_id' => $otherClinic->id, 'title' => 'Da outra clínica', 'status' => 'draft']);
        $otherGroup    = TreatmentPlanGroup::create(['treatment_plan_id' => $otherPlan->id, 'name' => 'Deles', 'sort_order' => 0]);
        $otherExercise = TreatmentPlanExercise::create([
            'treatment_plan_id'       => $otherPlan->id,
            'treatment_plan_group_id' => $otherGroup->id,
            'exercise_id'             => $this->squat->exercise_id,
            'sort_order'              => 0,
        ]);

        $payload                       = $this->currentPayload();
        $payload['groups'][0]['id']    = $otherGroup->id;
        $payload['exercises'][0]['id'] = $otherExercise->id;

        $this->putPlan($payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['groups.0.id', 'exercises.0.id']);

        $this->assertSame('Deles', $otherGroup->fresh()->name);
        $this->assertSame($otherPlan->id, $otherExercise->fresh()->treatment_plan_id);
    }

    public function test_the_same_exercise_id_twice_is_rejected(): void
    {
        $payload                  = $this->currentPayload();
        $payload['exercises'][1]  = $payload['exercises'][0];

        $this->putPlan($payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors('exercises.1.id');

        $this->assertNotNull(TreatmentPlanExercise::find($this->bridge->id));
    }

    public function test_exercise_removed_from_the_catalog_does_not_block_editing(): void
    {
        $this->registerSeries($this->squat);
        Exercise::find($this->squat->exercise_id)->delete();

        $payload                                    = $this->currentPayload();
        $payload['exercises'][0]['repetitions_min'] = 8;

        $this->putPlan($payload)->assertOk();

        $squat = $this->squat->fresh();
        $this->assertSame(8, $squat->repetitions_min);
        $this->assertSame(3, $squat->sets_min);
        $this->assertSame(1, $this->seriesCountOf($this->squat));
    }

    public function test_dose_with_only_the_minimum_uses_it_as_maximum_not_the_catalog(): void
    {
        $catalog = $this->newCatalogExercise('Remada');
        $catalog->update(['sets' => 2, 'repetitions' => 15, 'rest_time' => 45]);

        $payload                 = $this->currentPayload();
        $payload['exercises'][0] = array_merge($payload['exercises'][0], [
            'sets_min' => 4, 'sets_max' => null, 'repetitions_min' => 8, 'repetitions_max' => null,
        ]);
        $payload['exercises'][] = [
            'exercise_id' => $catalog->id, 'group_index' => 0,
            'sets_min'    => 3, 'sets_max' => null, 'repetitions_min' => 12, 'repetitions_max' => null,
        ];

        $this->putPlan($payload)->assertOk();

        $squat = $this->squat->fresh();
        $this->assertSame([4, 4, 8, 8], [$squat->sets_min, $squat->sets_max, $squat->repetitions_min, $squat->repetitions_max]);
        $new = TreatmentPlanExercise::where('exercise_id', $catalog->id)->first();
        $this->assertSame([3, 3, 12, 12, '45'], [$new->sets_min, $new->sets_max, $new->repetitions_min, $new->repetitions_max, $new->rest_time]);
    }

    public function test_dose_with_minimum_above_maximum_is_rejected(): void
    {
        $payload                 = $this->currentPayload();
        $payload['exercises'][0] = array_merge($payload['exercises'][0], ['sets_min' => 5, 'sets_max' => 2]);

        $this->putPlan($payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors('exercises.0.sets_max');
    }

    public function test_exercise_out_of_catalog_keeps_its_current_dose_when_sent_empty(): void
    {
        Exercise::find($this->squat->exercise_id)->delete();

        $payload                 = $this->currentPayload();
        $payload['exercises'][0] = array_merge($payload['exercises'][0], [
            'sets_min' => null, 'sets_max' => null, 'repetitions_min' => null, 'repetitions_max' => null,
        ]);

        $this->putPlan($payload)->assertOk();

        $squat = $this->squat->fresh();
        $this->assertSame([3, 4, 10, 12, '60s'], [$squat->sets_min, $squat->sets_max, $squat->repetitions_min, $squat->repetitions_max, $squat->rest_time]);
    }

    // ------------------------------------------------------------ apoio

    private function newCatalogExercise(string $name): Exercise
    {
        return Exercise::create([
            'name'           => $name,
            'physio_area_id' => $this->physioArea->id,
            'body_region_id' => $this->bodyRegion->id,
            'created_by'     => $this->adminUser->id,
            'is_active'      => true,
        ]);
    }

    /** Paciente registra uma série do exercício pelo link do programa. */
    private function registerSeries(TreatmentPlanExercise $planExercise): void
    {
        $executionId = $this->actingAs($this->patient, 'patient')
            ->postJson("/api/patient/programs/{$this->plan->public_token}/executions")
            ->assertOk()
            ->json('data.id');

        $this->actingAs($this->patient, 'patient')
            ->postJson("/api/patient/programs/{$this->plan->public_token}/executions/{$executionId}/series", [
                'exercise_id' => $planExercise->id,
                'series'      => [
                    ['count' => 12, 'weight_value' => '5', 'weight_unit' => 'kg', 'is_bodyweight' => false],
                ],
            ])
            ->assertOk();
    }

    private function seriesCountOf(TreatmentPlanExercise $planExercise): int
    {
        return TreatmentPlanExecutionSeries::where('treatment_plan_exercise_id', $planExercise->id)->count();
    }

    /** O programa como a tela de edição manda de volta, com os ids. */
    private function currentPayload(): array
    {
        return [
            'title'  => $this->plan->title,
            'groups' => [
                ['id' => $this->group->id, 'name' => $this->group->name, 'sort_order' => 0],
            ],
            'exercises' => [
                $this->exercisePayload($this->squat, 0),
                $this->exercisePayload($this->bridge, 0),
            ],
        ];
    }

    private function exercisePayload(TreatmentPlanExercise $e, int $groupIndex): array
    {
        return [
            'id'              => $e->id,
            'exercise_id'     => $e->exercise_id,
            'group_index'     => $groupIndex,
            'days_of_week'    => $e->days_of_week,
            'period'          => $e->period,
            'sets_min'        => $e->sets_min,
            'sets_max'        => $e->sets_max,
            'repetitions_min' => $e->repetitions_min,
            'repetitions_max' => $e->repetitions_max,
            'notes'           => $e->notes,
        ];
    }

    private function putPlan(array $payload)
    {
        return $this->actingAs($this->clinicUser, 'clinic')
            ->putJson("/api/clinic/treatment-plans/{$this->plan->id}", $payload);
    }
}
