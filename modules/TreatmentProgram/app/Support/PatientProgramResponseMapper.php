<?php

namespace Modules\TreatmentProgram\Support;

use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Models\TreatmentPlanExecution;
use Modules\TreatmentProgram\Models\TreatmentPlanExercise;

class PatientProgramResponseMapper
{
    public function __construct(
        protected PatientProgramStatusMapper $statusMapper,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function listItem(TreatmentPlan $plan): array
    {
        $plan->loadMissing(['clinicUser', 'clinic']);
        $plan->loadCount('exercises');

        $professional = $plan->clinicUser;

        return [
            'public_token'              => $plan->public_token,
            'name'                      => $plan->title,
            'professional_name'         => $professional?->name ?? '',
            'professional_photo_url'    => $professional?->photo_url,
            'professional_registration' => $professional?->document,
            'clinic_name'               => $plan->clinic?->name,
            'clinic_slug'               => $plan->clinic?->slug,
            'start_date'        => $plan->start_date?->toDateString(),
            'end_date'          => $plan->end_date?->toDateString(),
            'status'            => $this->statusMapper->map($plan),
            'exercise_count'    => (int) ($plan->exercises_count ?? $plan->exercises()->count()),
        ];
    }

    /**
     * @param  array<int, array<string, mixed>|null>  $lastLoads
     * @return array<string, mixed>
     */
    public function detail(
        TreatmentPlan $plan,
        ?TreatmentPlanExecution $currentExecution = null,
        array $lastLoads = [],
    ): array {
        $plan->loadMissing([
            'clinicUser',
            'clinic',
            'groups.exercises.exercise.videos',
        ]);

        $payload                                 = $this->listItem($plan);
        $payload['message']                      = $plan->message;
        $payload['outcome_pain_enabled']         = (bool) $plan->outcome_pain_enabled;
        $payload['outcome_difficulty_enabled']   = (bool) $plan->outcome_difficulty_enabled;
        $payload['outcome_satisfaction_enabled'] = (bool) $plan->outcome_satisfaction_enabled;
        $payload['groups']                       = $this->mapGroups($plan);
        $payload['exercises']                    = $this->mapFlatExercises($plan);
        $payload['current_execution']            = $this->mapCurrentExecution($currentExecution, $lastLoads);

        return $payload;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function mapGroups(TreatmentPlan $plan): array
    {
        return $plan->groups->map(function ($group) {
            return [
                'id'        => $group->id,
                'name'      => $group->name,
                'exercises' => $group->exercises->map(fn ($exercise) => $this->mapExercise($exercise))->values()->all(),
            ];
        })->values()->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function mapFlatExercises(TreatmentPlan $plan): array
    {
        $exercises = collect();

        foreach ($plan->groups as $group) {
            foreach ($group->exercises as $exercise) {
                $exercises->push($this->mapExercise($exercise));
            }
        }

        return $exercises->values()->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function mapExercise(TreatmentPlanExercise $planExercise): array
    {
        $catalog  = $planExercise->exercise;
        $video    = $catalog?->videos?->first();

        return [
            'id'             => $planExercise->id,
            'name'           => $catalog?->name ?? '',
            'description'    => $catalog?->description,
            'video_url'      => $video?->cdn_url ?? $video?->url,
            'thumbnail_url'  => $video?->thumbnail_url,
            'notes'          => $planExercise->notes,
            'days'           => $planExercise->days_of_week ?? [],
            'period'         => !empty($planExercise->period) ? [$planExercise->period] : [],
            'prescription'   => [
                'series_min'       => $planExercise->sets_min,
                'series_max'       => $planExercise->sets_max,
                'repetitions_min'  => $planExercise->repetitions_min,
                'repetitions_max'  => $planExercise->repetitions_max,
                'load_min'         => $planExercise->load_min,
                'load_max'         => $planExercise->load_max,
                'rest_time'        => $planExercise->rest_time,
            ],
        ];
    }

    /**
     * @param  array<int, array<string, mixed>|null>  $lastLoads
     * @return array<string, mixed>|null
     */
    private function mapCurrentExecution(?TreatmentPlanExecution $execution, array $lastLoads): ?array
    {
        if (is_null($execution)) {
            return null;
        }

        return [
            'id'                      => $execution->id,
            'unfinished_exercise_ids' => $execution->unfinished_exercise_ids ?? [],
            'last_loads'              => $lastLoads,
        ];
    }
}
