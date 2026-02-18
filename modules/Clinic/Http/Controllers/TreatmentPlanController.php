<?php

namespace Modules\Clinic\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Admin\Models\BodyRegion;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\PhysioSubarea;
use Modules\Clinic\Contracts\TreatmentPlanServiceInterface;
use Modules\Clinic\Http\Requests\TreatmentPlanStoreRequest;
use Modules\Clinic\Http\Requests\TreatmentPlanUpdateRequest;
use Modules\Clinic\Models\TreatmentPlan;
use Modules\Clinic\Models\TreatmentPlanExercise;
use Modules\Patient\Models\Patient;

class TreatmentPlanController extends BaseController
{   
    const TAB_EXERCISES = 'exercicios';
    const TAB_HISTORY = 'historico';

    public function __construct(
        protected TreatmentPlanServiceInterface $service,
    ) {
        parent::__construct();
    }

    public function index(Request $request): Response
    {
        $clinicId  = $this->clinic->id;
        $tab       = $request->input('tab', self::TAB_HISTORY);
        $physioAreas = PhysioArea::orderBy('name')->get(['id', 'name']);

        if ($tab === self::TAB_EXERCISES) {
            $query = Exercise::query()
                ->with(['physioArea', 'bodyRegion', 'videos'])
                ->active()
                ->latest();

            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('muscle_group', 'like', "%{$search}%")
                        ->orWhere('therapeutic_goal', 'like', "%{$search}%");
                });
            }

            if ($areaIds = $request->input('physio_area_id')) {
                $query->whereIn('physio_area_id', (array) $areaIds);
            }

            if ($regionIds = $request->input('body_region_id')) {
                $query->whereIn('body_region_id', (array) $regionIds);
            }

            if ($difficulties = $request->input('difficulty_level')) {
                $query->whereIn('difficulty_level', (array) $difficulties);
            }

            if ($forms = $request->input('movement_form')) {
                $query->whereIn('movement_form', (array) $forms);
            }

            return Inertia::render('clinic/treatment-plans/index', [
                'tab'             => self::TAB_EXERCISES,
                'exercises'       => $query->paginate(24)->withQueryString(),
                'exerciseFilters' => $request->only(['search', 'physio_area_id', 'body_region_id', 'difficulty_level', 'movement_form']),
                'physioAreas'     => $physioAreas,
                'bodyRegions'     => BodyRegion::orderBy('name')->get(['id', 'name']),
                'difficulties'    => Exercise::DIFFICULTIES,
                'movementForms'   => Exercise::MOVEMENT_FORMS,
                'plans'    => ['data' => [], 'current_page' => 1, 'last_page' => 1, 'total' => 0, 'links' => []],
                'filters'  => [],
                'statuses' => TreatmentPlan::STATUSES,
                'patients' => [],
            ]);
        }

        $plans = $this->service->list(
            $clinicId,
            $request->only(['search', 'status', 'patient_id', 'physio_area_id', 'clinic_user_id']),
        );

        return Inertia::render('clinic/treatment-plans/index', [
            'tab'      => self::TAB_HISTORY,
            'plans'    => $plans,
            'filters'  => $request->only(['search', 'status', 'patient_id', 'physio_area_id']),
            'statuses' => TreatmentPlan::STATUSES,
            'patients' => Patient::where('clinic_id', $clinicId)->orderBy('name')->get(['id', 'name']),
            'physioAreas' => $physioAreas,
            'exercises'       => ['data' => [], 'current_page' => 1, 'last_page' => 1, 'total' => 0, 'links' => []],
            'exerciseFilters' => [],
            'bodyRegions'     => [],
            'difficulties'    => [],
            'movementForms'   => [],
        ]);
    }

    public function create(Request $request): Response
    {
        $clinicId = $this->clinic->id;

        return Inertia::render('clinic/treatment-plans/create', [
            'patients'       => Patient::where('clinic_id', $clinicId)->active()->orderBy('name')->get(['id', 'name']),
            'physioAreas'    => PhysioArea::orderBy('name')->get(['id', 'name']),
            'physioSubareas' => PhysioSubarea::orderBy('name')->get(['id', 'name', 'physio_area_id']),
            'statuses'       => TreatmentPlan::STATUSES,
            'periods'        => TreatmentPlanExercise::PERIODS,
        ]);
    }

    public function store(TreatmentPlanStoreRequest $request): RedirectResponse
    {
        $data = array_merge($request->validated(), [
            'clinic_id'      => $this->user->clinic_id,
            'clinic_user_id' => $this->user->id,
        ]);

        $this->service->create($data);

        return redirect()
            ->route('treatment-plans.index')
            ->with('success', 'Plano de tratamento criado com sucesso.');
    }

    public function show(int $id): Response
    {
        $plan = $this->service->find($id);
        $plan->load(['groups.exercises.exercise.physioArea', 'groups.exercises.exercise.bodyRegion', 'groups.exercises.exercise.videos', 'exercises.exercise.physioArea', 'exercises.exercise.bodyRegion', 'exercises.exercise.videos', 'patient', 'clinicUser', 'physioArea', 'physioSubarea']);

        $this->authorizeClinic($plan);

        return Inertia::render('clinic/treatment-plans/show', [
            'plan'     => $plan,
            'statuses' => TreatmentPlan::STATUSES,
            'periods'  => TreatmentPlanExercise::PERIODS,
        ]);
    }

    public function edit(int $id): Response
    {
        $plan = $this->service->find($id);
        $plan->load(['groups.exercises.exercise', 'exercises.exercise', 'patient']);

        $this->authorizeClinic($plan);

        $clinicId = $this->user->clinic_id;

        return Inertia::render('clinic/treatment-plans/edit', [
            'plan'           => $plan,
            'patients'       => Patient::where('clinic_id', $clinicId)->active()->orderBy('name')->get(['id', 'name']),
            'physioAreas'    => PhysioArea::orderBy('name')->get(['id', 'name']),
            'physioSubareas' => PhysioSubarea::orderBy('name')->get(['id', 'name', 'physio_area_id']),
            'statuses'       => TreatmentPlan::STATUSES,
            'periods'        => TreatmentPlanExercise::PERIODS,
        ]);
    }

    public function update(TreatmentPlanUpdateRequest $request, int $id): RedirectResponse
    {
        $plan = $this->service->find($id);
        $this->authorizeClinic($plan);

        $this->service->update($id, $request->validated());

        return redirect()
            ->route('treatment-plans.show', $id)
            ->with('success', 'Plano de tratamento atualizado com sucesso.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $plan = $this->service->find($id);
        $this->authorizeClinic($plan);

        $this->service->delete($id);

        return redirect()
            ->route('treatment-plans.index')
            ->with('success', 'Plano de tratamento excluído com sucesso.');
    }

    public function duplicate(int $id): RedirectResponse
    {
        $plan = $this->service->find($id);
        $this->authorizeClinic($plan);

        $newPlan = $this->service->duplicate($id);

        return redirect()
            ->route('treatment-plans.edit', $newPlan->id)
            ->with('success', 'Plano duplicado com sucesso. Edite os dados conforme necessário.');
    }

    public function toggleFavorite(Request $request, int $exerciseId): RedirectResponse
    {
        $user   = $this->user;
        $exists = $user->exerciseFavorites()->where('exercise_id', $exerciseId)->exists();

        if ($exists) {
            $user->exerciseFavorites()->where('exercise_id', $exerciseId)->delete();
            $message = 'Exercício removido dos favoritos.';
        } else {
            $user->exerciseFavorites()->create(['exercise_id' => $exerciseId]);
            $message = 'Exercício adicionado aos favoritos.';
        }

        return back()->with('success', $message);
    }

    protected function authorizeClinic(TreatmentPlan $plan): void
    {
        abort_if($plan->clinic_id !== $this->user->clinic_id, 403, 'Acesso negado.');
    }
}
