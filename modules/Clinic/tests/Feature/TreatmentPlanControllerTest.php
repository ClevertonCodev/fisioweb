<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\Admin\Models\BodyRegion;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\TreatmentPlan;
use Modules\Clinic\Models\TreatmentPlanExercise;
use Modules\Clinic\Models\TreatmentPlanGroup;
use Modules\Media\Models\Video;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class TreatmentPlanControllerTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $clinicUser;

    private AdminUser $adminUser;

    private PhysioArea $physioArea;

    private BodyRegion $bodyRegion;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();

        $this->clinicUser = ClinicUser::factory()->create();
        $this->adminUser  = AdminUser::factory()->create();
        $this->physioArea = PhysioArea::create(['name' => 'Ortopedia']);
        $this->bodyRegion = BodyRegion::create(['name' => 'Joelho']);
    }

    public function test_show_loads_exercises_with_videos_for_my_programs(): void
    {
        $exercise = Exercise::create([
            'name'           => 'Exercício de Teste',
            'physio_area_id' => $this->physioArea->id,
            'body_region_id' => $this->bodyRegion->id,
            'created_by'     => $this->adminUser->id,
            'is_active'      => true,
        ]);

        $video = Video::factory()->create([
            'url'           => 'http://example.com/video.mp4',
            'cdn_url'       => 'http://cdn.example.com/video.mp4',
            'thumbnail_url' => 'http://example.com/thumb.jpg',
        ]);
        $exercise->videos()->attach($video->id);

        $plan = TreatmentPlan::create([
            'clinic_id'      => $this->clinicUser->clinic_id,
            'clinic_user_id' => $this->clinicUser->id,
            'title'          => 'Meu Modelo de Teste',
            'status'         => 'active',
        ]);

        $group = TreatmentPlanGroup::create([
            'treatment_plan_id' => $plan->id,
            'name'              => 'Aquecimento',
            'sort_order'        => 0,
        ]);

        TreatmentPlanExercise::create([
            'treatment_plan_id'       => $plan->id,
            'treatment_plan_group_id' => $group->id,
            'exercise_id'             => $exercise->id,
            'sort_order'              => 0,
        ]);

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->getJson("/api/clinic/treatment-plans/{$plan->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $plan->id)
            ->assertJsonPath('data.groups.0.exercises.0.exercise.id', $exercise->id)
            ->assertJsonPath('data.groups.0.exercises.0.exercise.videos.0.thumbnail_url', 'http://example.com/thumb.jpg')
            ->assertJsonPath('data.groups.0.exercises.0.exercise.videos.0.cdn_url', 'http://cdn.example.com/video.mp4');
    }

    public function test_index_includes_exercises_count_clinic_user_patient_photo_and_engagement(): void
    {
        $exercise = Exercise::create([
            'name'           => 'Exercício Listagem',
            'physio_area_id' => $this->physioArea->id,
            'body_region_id' => $this->bodyRegion->id,
            'created_by'     => $this->adminUser->id,
            'is_active'      => true,
        ]);

        $patient = Patient::factory()->create([
            'clinic_id' => $this->clinicUser->clinic_id,
            'name'      => 'Paciente Teste',
            'photo_url' => 'https://cdn.example.com/patient.jpg',
        ]);

        $plan = TreatmentPlan::create([
            'clinic_id'               => $this->clinicUser->clinic_id,
            'clinic_user_id'          => $this->clinicUser->id,
            'patient_id'              => $patient->id,
            'title'                   => 'Plano com métricas de engajamento',
            'status'                  => TreatmentPlan::STATUS_ACTIVE,
            'start_date'              => now()->subDays(5)->toDateString(),
            'end_date'                => now()->addDays(20)->toDateString(),
            'patient_viewed_at'       => now()->subDay(),
            'patient_completed_count' => 4,
        ]);

        $group = TreatmentPlanGroup::create([
            'treatment_plan_id' => $plan->id,
            'name'              => 'Grupo',
            'sort_order'        => 0,
        ]);

        TreatmentPlanExercise::create([
            'treatment_plan_id'       => $plan->id,
            'treatment_plan_group_id' => $group->id,
            'exercise_id'             => $exercise->id,
            'sort_order'              => 0,
        ]);

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->getJson('/api/clinic/treatment-plans?per_page=15');

        $response->assertOk()
            ->assertJsonPath('data.data.0.id', $plan->id)
            ->assertJsonPath('data.data.0.exercises_count', 1)
            ->assertJsonPath('data.data.0.patient.id', $patient->id)
            ->assertJsonPath('data.data.0.patient.name', 'Paciente Teste')
            ->assertJsonPath('data.data.0.patient.photo_url', 'https://cdn.example.com/patient.jpg')
            ->assertJsonPath('data.data.0.clinic_user.id', $this->clinicUser->id)
            ->assertJsonPath('data.data.0.clinic_user.name', $this->clinicUser->name)
            ->assertJsonPath('data.data.0.patient_completed_count', 4);

        $this->assertNotNull($response->json('data.data.0.patient_viewed_at'));
    }

    public function test_index_does_not_list_plans_from_other_clinic(): void
    {
        $otherUser = ClinicUser::factory()->create();

        TreatmentPlan::create([
            'clinic_id'      => $otherUser->clinic_id,
            'clinic_user_id' => $otherUser->id,
            'title'          => 'Plano de outra clínica',
            'status'         => TreatmentPlan::STATUS_ACTIVE,
        ]);

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->getJson('/api/clinic/treatment-plans?per_page=50');

        $response->assertOk();
        $titles = collect($response->json('data.data'))->pluck('title')->all();
        $this->assertNotContains('Plano de outra clínica', $titles);
    }

    public function test_duplicate_creates_copy_with_suffix_no_patient_and_draft_status(): void
    {
        $patient = Patient::factory()->create(['clinic_id' => $this->clinicUser->clinic_id]);

        $plan = TreatmentPlan::create([
            'clinic_id'      => $this->clinicUser->clinic_id,
            'clinic_user_id' => $this->clinicUser->id,
            'patient_id'     => $patient->id,
            'title'          => 'Reabilitação Lombar',
            'status'         => TreatmentPlan::STATUS_ACTIVE,
        ]);

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/treatment-plans/{$plan->id}/duplicate");

        $response->assertCreated()
            ->assertJsonPath('data.title', 'Reabilitação Lombar (cópia)')
            ->assertJsonPath('data.patient_id', null)
            ->assertJsonPath('data.status', TreatmentPlan::STATUS_DRAFT);
    }

    public function test_duplicate_copies_groups_and_exercises(): void
    {
        $exercise = Exercise::create([
            'name'           => 'Ponte Glútea',
            'physio_area_id' => $this->physioArea->id,
            'body_region_id' => $this->bodyRegion->id,
            'created_by'     => $this->adminUser->id,
            'is_active'      => true,
        ]);

        $plan = TreatmentPlan::create([
            'clinic_id'      => $this->clinicUser->clinic_id,
            'clinic_user_id' => $this->clinicUser->id,
            'title'          => 'Programa Original',
            'status'         => TreatmentPlan::STATUS_ACTIVE,
        ]);

        $group = TreatmentPlanGroup::create([
            'treatment_plan_id' => $plan->id,
            'name'              => 'Principal',
            'sort_order'        => 0,
        ]);

        TreatmentPlanExercise::create([
            'treatment_plan_id'       => $plan->id,
            'treatment_plan_group_id' => $group->id,
            'exercise_id'             => $exercise->id,
            'sets_min'                => 3,
            'sets_max'                => 3,
            'repetitions_min'         => 10,
            'repetitions_max'         => 15,
            'sort_order'              => 0,
        ]);

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/treatment-plans/{$plan->id}/duplicate");

        $response->assertCreated();

        $newId = $response->json('data.id');
        $this->assertNotEquals($plan->id, $newId);

        $this->assertDatabaseHas('clinic_treatment_plan_groups', [
            'treatment_plan_id' => $newId,
            'name'              => 'Principal',
        ]);

        $this->assertDatabaseHas('clinic_treatment_plan_exercises', [
            'treatment_plan_id' => $newId,
            'exercise_id'       => $exercise->id,
            'sets_min'          => 3,
            'repetitions_min'   => 10,
        ]);
    }

    public function test_duplicate_returns_404_for_plan_from_other_clinic(): void
    {
        $otherUser = ClinicUser::factory()->create();

        $otherPlan = TreatmentPlan::create([
            'clinic_id'      => $otherUser->clinic_id,
            'clinic_user_id' => $otherUser->id,
            'title'          => 'Plano Privado',
            'status'         => TreatmentPlan::STATUS_ACTIVE,
        ]);

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/treatment-plans/{$otherPlan->id}/duplicate")
            ->assertNotFound();
    }

    public function test_duplicate_requires_authentication(): void
    {
        $plan = TreatmentPlan::create([
            'clinic_id'      => $this->clinicUser->clinic_id,
            'clinic_user_id' => $this->clinicUser->id,
            'title'          => 'Plano',
            'status'         => TreatmentPlan::STATUS_DRAFT,
        ]);

        $this->postJson("/api/clinic/treatment-plans/{$plan->id}/duplicate")
            ->assertUnauthorized();
    }

    // -------------------------------------------------------------------------
    // toModel
    // -------------------------------------------------------------------------

    public function test_to_model_creates_copy_keeping_title_without_patient_and_as_draft(): void
    {
        $patient = Patient::factory()->create(['clinic_id' => $this->clinicUser->clinic_id]);

        $plan = TreatmentPlan::create([
            'clinic_id'      => $this->clinicUser->clinic_id,
            'clinic_user_id' => $this->clinicUser->id,
            'patient_id'     => $patient->id,
            'title'          => 'Fortalecimento de Joelho',
            'status'         => TreatmentPlan::STATUS_ACTIVE,
            'message'        => 'Realize com atenção.',
        ]);

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/treatment-plans/{$plan->id}/to-model");

        $response->assertCreated()
            ->assertJsonPath('data.title', 'Fortalecimento de Joelho')
            ->assertJsonPath('data.patient_id', null)
            ->assertJsonPath('data.status', TreatmentPlan::STATUS_DRAFT);

        $newId = $response->json('data.id');
        $this->assertNotEquals($plan->id, $newId);
        $this->assertDatabaseHas('clinic_treatment_plans', [
            'id'      => $newId,
            'message' => 'Realize com atenção.',
        ]);
    }

    public function test_to_model_copies_groups_and_exercises(): void
    {
        $exercise = Exercise::create([
            'name'           => 'Bird Dog',
            'physio_area_id' => $this->physioArea->id,
            'body_region_id' => $this->bodyRegion->id,
            'created_by'     => $this->adminUser->id,
            'is_active'      => true,
        ]);

        $plan = TreatmentPlan::create([
            'clinic_id'      => $this->clinicUser->clinic_id,
            'clinic_user_id' => $this->clinicUser->id,
            'title'          => 'Programa Modelo',
            'status'         => TreatmentPlan::STATUS_ACTIVE,
        ]);

        $group = TreatmentPlanGroup::create([
            'treatment_plan_id' => $plan->id,
            'name'              => 'Aquecimento',
            'sort_order'        => 0,
        ]);

        TreatmentPlanExercise::create([
            'treatment_plan_id'       => $plan->id,
            'treatment_plan_group_id' => $group->id,
            'exercise_id'             => $exercise->id,
            'sets_min'                => 2,
            'sets_max'                => 4,
            'repetitions_min'         => 12,
            'sort_order'              => 0,
        ]);

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/treatment-plans/{$plan->id}/to-model");

        $response->assertCreated();

        $newId = $response->json('data.id');

        $this->assertDatabaseHas('clinic_treatment_plan_groups', [
            'treatment_plan_id' => $newId,
            'name'              => 'Aquecimento',
        ]);

        $this->assertDatabaseHas('clinic_treatment_plan_exercises', [
            'treatment_plan_id' => $newId,
            'exercise_id'       => $exercise->id,
            'sets_min'          => 2,
            'sets_max'          => 4,
            'repetitions_min'   => 12,
        ]);
    }

    public function test_to_model_returns_404_for_plan_from_other_clinic(): void
    {
        $otherUser = ClinicUser::factory()->create();

        $otherPlan = TreatmentPlan::create([
            'clinic_id'      => $otherUser->clinic_id,
            'clinic_user_id' => $otherUser->id,
            'title'          => 'Plano Privado',
            'status'         => TreatmentPlan::STATUS_ACTIVE,
        ]);

        $this->actingAs($this->clinicUser, 'clinic')
            ->postJson("/api/clinic/treatment-plans/{$otherPlan->id}/to-model")
            ->assertNotFound();
    }

    public function test_to_model_requires_authentication(): void
    {
        $plan = TreatmentPlan::create([
            'clinic_id'      => $this->clinicUser->clinic_id,
            'clinic_user_id' => $this->clinicUser->id,
            'title'          => 'Plano',
            'status'         => TreatmentPlan::STATUS_DRAFT,
        ]);

        $this->postJson("/api/clinic/treatment-plans/{$plan->id}/to-model")
            ->assertUnauthorized();
    }
}
