<?php

namespace Modules\TreatmentProgram\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\Admin\Models\Exercise;
use Modules\Clinic\Models\Clinic;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Tests\Support\CreatesPatientProgramFixtures;
use Tests\TestCase;

/**
 * Programa só recebe exercício que a clínica enxerga na biblioteca: aprovado
 * no catálogo ou enviado por ela. Exercício privado de outra clínica não entra.
 */
class TreatmentPlanExerciseVisibilityTest extends TestCase
{
    use CreatesPatientProgramFixtures;
    use RefreshDatabase;

    private Exercise $privateOfAnotherClinic;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
        $this->setUpPatientProgramFixtures();

        $this->privateOfAnotherClinic = $this->exercise('Envio da outra clínica', [
            'clinic_id'     => Clinic::factory()->create()->id,
            'review_status' => Exercise::REVIEW_PENDING,
        ]);
    }

    public function test_create_rejects_private_exercise_of_another_clinic(): void
    {
        $before = TreatmentPlan::count();

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/treatment-plans', [
                'title'     => 'Com exercício alheio',
                'exercises' => [
                    ['exercise_id' => $this->exercise('Aprovado')->id],
                    ['exercise_id' => $this->privateOfAnotherClinic->id],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('exercises.1.exercise_id')
            ->assertJsonMissingValidationErrors('exercises.0.exercise_id');

        $this->assertSame($before, TreatmentPlan::count());
    }

    public function test_update_rejects_adding_private_exercise_of_another_clinic(): void
    {
        ['plan' => $plan, 'planExercise' => $kept] = $this->createActiveProgram($this->createPatient());

        $this->actingAs($this->clinicUser, 'clinic')
            ->putJson("/api/clinic/treatment-plans/{$plan->id}", [
                'title'     => 'Não deve gravar',
                'exercises' => [
                    ['id' => $kept->id, 'exercise_id' => $kept->exercise_id],
                    ['exercise_id' => $this->privateOfAnotherClinic->id],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('exercises.1.exercise_id');

        $this->assertSame('Programa de Reabilitação', $plan->fresh()->title);
        $this->assertSame(1, $plan->exercises()->count());
    }

    public function test_approved_and_own_pending_exercises_are_accepted(): void
    {
        $ownPending = $this->exercise('Envio da própria clínica', [
            'clinic_id'     => $this->clinicUser->clinic_id,
            'review_status' => Exercise::REVIEW_PENDING,
        ]);

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/treatment-plans', [
                'title'     => 'Só exercícios visíveis',
                'exercises' => [
                    ['exercise_id' => $this->exercise('Aprovado')->id],
                    ['exercise_id' => $ownPending->id],
                ],
            ])
            ->assertCreated()
            ->assertJsonCount(2, 'data.exercises');
    }

    public function test_exercise_already_in_the_program_stays_accepted_on_edit(): void
    {
        ['plan' => $plan, 'planExercise' => $kept, 'exercise' => $catalog] =
            $this->createActiveProgram($this->createPatient());
        // Depois de prescrito, o exercício deixou de ser visível para a clínica.
        $catalog->update(['clinic_id' => Clinic::factory()->create()->id, 'review_status' => Exercise::REVIEW_PENDING]);

        $this->actingAs($this->clinicUser, 'clinic')
            ->putJson("/api/clinic/treatment-plans/{$plan->id}", [
                'title'     => 'Ajuste de dose',
                'exercises' => [
                    ['id' => $kept->id, 'exercise_id' => $catalog->id, 'repetitions_min' => 8],
                ],
            ])
            ->assertOk();

        $this->assertSame(8, $kept->fresh()->repetitions_min);
    }

    public function test_create_rejects_inverted_repetitions_and_load(): void
    {
        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/treatment-plans', [
                'title'     => 'Faixa invertida',
                'exercises' => [[
                    'exercise_id'     => $this->exercise('Aprovado')->id,
                    'repetitions_min' => 12,
                    'repetitions_max' => 8,
                    'load_min'        => 10,
                    'load_max'        => 5,
                ]],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['exercises.0.repetitions_max', 'exercises.0.load_max']);
    }

    public function test_create_with_only_the_maximum_uses_it_as_minimum(): void
    {
        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/treatment-plans', [
                'title'     => 'Só o máximo',
                'exercises' => [[
                    'exercise_id' => $this->exercise('Aprovado', ['sets' => 4])->id,
                    'sets_max'    => 2,
                ]],
            ])
            ->assertCreated();

        $exercise = TreatmentPlan::find($response->json('data.id'))->exercises()->first();
        $this->assertSame([2, 2], [$exercise->sets_min, $exercise->sets_max]);
    }

    // ------------------------------------------------------------ apoio

    private function exercise(string $name, array $overrides = []): Exercise
    {
        return Exercise::create(array_merge([
            'name'           => $name,
            'physio_area_id' => $this->physioArea->id,
            'body_region_id' => $this->bodyRegion->id,
            'created_by'     => $this->adminUser->id,
            'is_active'      => true,
        ], $overrides));
    }
}
