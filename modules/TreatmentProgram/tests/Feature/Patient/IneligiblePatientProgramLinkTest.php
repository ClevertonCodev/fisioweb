<?php

namespace Modules\TreatmentProgram\Tests\Feature\Patient;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Illuminate\Testing\TestResponse;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Models\TreatmentPlanExecution;
use Modules\TreatmentProgram\Models\TreatmentPlanExercise;
use Modules\TreatmentProgram\Tests\Support\CreatesPatientProgramFixtures;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class IneligiblePatientProgramLinkTest extends TestCase
{
    use CreatesPatientProgramFixtures;
    use RefreshDatabase;

    private Patient $patient;

    private TreatmentPlan $plan;

    private TreatmentPlanExercise $planExercise;

    private int $executionId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpPatientProgramFixtures();

        $this->patient = $this->createPatient();
        [
            'plan'         => $this->plan,
            'planExercise' => $this->planExercise,
        ] = $this->createActiveProgram($this->patient);

        $this->executionId = (int) $this->postJson("/api/patient/programs/{$this->plan->public_token}/executions")
            ->assertOk()
            ->json('data.id');
    }

    /**
     * @return array<string, array{string}>
     */
    public static function linkRoutes(): array
    {
        return [
            'show'       => ['show'],
            'view'       => ['view'],
            'executions' => ['executions'],
            'series'     => ['series'],
            'update'     => ['update'],
            'feedback'   => ['feedback'],
            'complete'   => ['complete'],
        ];
    }

    public function test_every_program_link_route_is_covered_here(): void
    {
        $linkRoutes = collect(Route::getRoutes()->getRoutes())
            ->filter(fn ($route) => str_contains($route->uri(), 'patient/programs/{publicToken}'))
            ->map(fn ($route) => $route->getName())
            ->sort()
            ->values()
            ->all();

        $this->assertSame([
            'api.patient.programs.complete',
            'api.patient.programs.executions.series',
            'api.patient.programs.executions.start',
            'api.patient.programs.executions.update',
            'api.patient.programs.feedback',
            'api.patient.programs.show',
            'api.patient.programs.view',
        ], $linkRoutes);
        $this->assertCount(count($linkRoutes), self::linkRoutes());
    }

    #[DataProvider('linkRoutes')]
    public function test_link_of_an_inactivated_patient_gives_404_and_writes_nothing(string $route): void
    {
        $this->asClinicUser($this->clinicUser)
            ->postJson('/api/clinic/patients/bulk-inactivate', ['ids' => [$this->patient->id]])
            ->assertOk()
            ->assertJsonPath('count', 1);

        $this->callLink($route)
            ->assertNotFound()
            ->assertJsonMissingPath('data');

        $this->assertNothingWritten();
    }

    /**
     * @return array<string, array{string, string}>
     */
    public static function blockedStatusesPerRoute(): array
    {
        $cases = [];
        foreach ([Patient::STATUS_OBITO, Patient::STATUS_CANCELADO] as $status) {
            foreach (array_keys(self::linkRoutes()) as $route) {
                $cases["{$status} {$route}"] = [$status, $route];
            }
        }

        return $cases;
    }

    #[DataProvider('blockedStatusesPerRoute')]
    public function test_link_of_a_patient_with_blocked_status_gives_404(string $status, string $route): void
    {
        $this->asClinicUser($this->clinicUser)
            ->putJson("/api/clinic/patients/{$this->patient->id}", ['status' => $status])
            ->assertOk()
            ->assertJsonPath('data.status', $status);

        $this->callLink($route)->assertNotFound();

        $this->assertNothingWritten();
    }

    #[DataProvider('linkRoutes')]
    public function test_link_of_a_deleted_patient_gives_404(string $route): void
    {
        $this->patient->delete();

        $this->callLink($route)->assertNotFound();
    }

    #[DataProvider('linkRoutes')]
    public function test_link_of_an_active_patient_keeps_working(string $route): void
    {
        $this->callLink($route)->assertOk();
    }

    public function test_discharged_patient_keeps_the_link_like_the_login(): void
    {
        $this->asClinicUser($this->clinicUser)
            ->putJson("/api/clinic/patients/{$this->patient->id}", ['status' => Patient::STATUS_ALTA])
            ->assertOk();

        $this->callLink('show')->assertOk()->assertJsonPath('data.public_token', $this->plan->public_token);
    }

    public function test_reactivated_patient_gets_the_link_back(): void
    {
        $this->asClinicUser($this->clinicUser)
            ->postJson('/api/clinic/patients/bulk-inactivate', ['ids' => [$this->patient->id]])
            ->assertOk();
        $this->callLink('show')->assertNotFound();

        $this->asClinicUser($this->clinicUser)
            ->postJson("/api/clinic/patients/{$this->patient->id}/reactivate")
            ->assertOk();

        $this->callLink('show')->assertOk();
    }

    public function test_user_of_another_clinic_cannot_cut_the_link(): void
    {
        $other = ClinicUser::factory()->create();

        $this->asClinicUser($other)
            ->postJson('/api/clinic/patients/bulk-inactivate', ['ids' => [$this->patient->id]])
            ->assertOk()
            ->assertJsonPath('count', 0);
        $this->asClinicUser($other)
            ->putJson("/api/clinic/patients/{$this->patient->id}", ['status' => Patient::STATUS_OBITO])
            ->assertNotFound();

        $this->callLink('show')->assertOk();
    }

    public function test_inactivating_the_same_cpf_in_another_clinic_cuts_only_that_link(): void
    {
        $other      = ClinicUser::factory()->create();
        $samePerson = Patient::factory()->create([
            'clinic_id' => $other->clinic_id,
            'cpf'       => $this->patient->cpf,
        ]);
        $otherPlan  = TreatmentPlan::create([
            'clinic_id'      => $other->clinic_id,
            'clinic_user_id' => $other->id,
            'patient_id'     => $samePerson->id,
            'public_token'   => '6f9a3c1e-2b7d-4e8f-9a0b-1c2d3e4f5a6b',
            'title'          => 'Programa da outra clínica',
            'status'         => TreatmentPlan::STATUS_ACTIVE,
            'start_date'     => now()->subDay()->toDateString(),
            'end_date'       => now()->addMonth()->toDateString(),
        ]);

        $this->asClinicUser($other)
            ->postJson('/api/clinic/patients/bulk-inactivate', ['ids' => [$samePerson->id]])
            ->assertOk()
            ->assertJsonPath('count', 1);

        $this->freshGuards();
        $this->getJson("/api/patient/programs/{$otherPlan->public_token}")->assertNotFound();
        $this->callLink('show')->assertOk();
    }

    private function callLink(string $route): TestResponse
    {
        $this->freshGuards();

        $base = "/api/patient/programs/{$this->plan->public_token}";

        return match ($route) {
            'show'       => $this->getJson($base),
            'view'       => $this->postJson("{$base}/view"),
            'executions' => $this->postJson("{$base}/executions"),
            'series'     => $this->postJson("{$base}/executions/{$this->executionId}/series", [
                'exercise_id' => $this->planExercise->id,
                'series'      => [
                    ['count' => 12, 'weight_value' => '5', 'weight_unit' => 'kg', 'is_bodyweight' => false],
                ],
            ]),
            'update'     => $this->patchJson("{$base}/executions/{$this->executionId}", [
                'unfinished_exercise_ids' => [$this->planExercise->id],
            ]),
            'feedback'   => $this->postJson("{$base}/feedback", [
                'pain'         => 2,
                'difficulty'   => 3,
                'rating'       => 'Bom',
                'execution_id' => $this->executionId,
            ]),
            'complete'   => $this->postJson("{$base}/complete"),
        };
    }

    private function assertNothingWritten(): void
    {
        $this->assertDatabaseHas('clinic_treatment_plans', [
            'id'                      => $this->plan->id,
            'patient_viewed_at'       => null,
            'patient_completed_count' => 0,
        ]);
        $this->assertDatabaseCount('clinic_treatment_plan_executions', 1);
        $this->assertDatabaseHas('clinic_treatment_plan_executions', [
            'id'     => $this->executionId,
            'status' => TreatmentPlanExecution::STATUS_IN_PROGRESS,
        ]);
        $this->assertDatabaseCount('clinic_treatment_plan_execution_series', 0);
        $this->assertDatabaseCount('clinic_treatment_plan_feedbacks', 0);
        $this->assertSame([], TreatmentPlanExecution::query()->find($this->executionId)->unfinished_exercise_ids ?? []);
    }

    private function asClinicUser(ClinicUser $user): static
    {
        $this->freshGuards();

        return $this->actingAs($user, 'clinic');
    }

    private function freshGuards(): void
    {
        $this->flushHeaders();
        $this->app['auth']->forgetGuards();
    }
}
