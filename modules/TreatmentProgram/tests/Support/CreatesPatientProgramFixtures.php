<?php

namespace Modules\TreatmentProgram\Tests\Support;

use Illuminate\Support\Str;
use Modules\Admin\Models\BodyRegion;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Media\Models\Video;
use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Models\TreatmentPlanExercise;
use Modules\TreatmentProgram\Models\TreatmentPlanGroup;

trait CreatesPatientProgramFixtures
{
    protected ClinicUser $clinicUser;

    protected AdminUser $adminUser;

    protected PhysioArea $physioArea;

    protected BodyRegion $bodyRegion;

    protected function setUpPatientProgramFixtures(): void
    {
        $this->clinicUser = ClinicUser::factory()->create();
        $this->adminUser  = AdminUser::factory()->create();
        $this->physioArea = PhysioArea::create(['name' => 'Ortopedia']);
        $this->bodyRegion = BodyRegion::create(['name' => 'Joelho']);

        Clinic::query()->whereKey($this->clinicUser->clinic_id)->update([
            'slug' => 'clinica-teste',
        ]);
    }

    protected function createPatient(array $overrides = []): Patient
    {
        return Patient::factory()->create(array_merge([
            'clinic_id' => $this->clinicUser->clinic_id,
        ], $overrides));
    }

    /**
     * @return array{plan: TreatmentPlan, group: TreatmentPlanGroup, planExercise: TreatmentPlanExercise, exercise: Exercise}
     */
    protected function createActiveProgram(Patient $patient, array $planOverrides = []): array
    {
        $exercise = Exercise::create([
            'name'           => 'Agachamento',
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

        $plan = TreatmentPlan::create(array_merge([
            'clinic_id'      => $this->clinicUser->clinic_id,
            'clinic_user_id' => $this->clinicUser->id,
            'patient_id'     => $patient->id,
            'public_token'   => (string) Str::uuid(),
            'title'          => 'Programa de Reabilitação',
            'message'        => 'Siga as orientações.',
            'status'         => TreatmentPlan::STATUS_ACTIVE,
            'start_date'     => now()->subDay()->toDateString(),
            'end_date'       => now()->addMonth()->toDateString(),
        ], $planOverrides));

        $group = TreatmentPlanGroup::create([
            'treatment_plan_id' => $plan->id,
            'name'              => 'Principal',
            'sort_order'        => 0,
        ]);

        $planExercise = TreatmentPlanExercise::create([
            'treatment_plan_id'       => $plan->id,
            'treatment_plan_group_id' => $group->id,
            'exercise_id'             => $exercise->id,
            'days_of_week'            => ['seg', 'qua', 'sex'],
            'period'                  => TreatmentPlanExercise::PERIOD_MORNING,
            'sets_min'                => 3,
            'sets_max'                => 4,
            'repetitions_min'         => 10,
            'repetitions_max'         => 12,
            'load_min'                => 5,
            'load_max'                => 10,
            'rest_time'               => '60s',
            'notes'                   => 'Manter coluna reta',
            'sort_order'              => 0,
        ]);

        return compact('plan', 'group', 'planExercise', 'exercise');
    }
}
