<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\PhysioSubarea;
use Modules\Clinic\Contracts\TreatmentPlanServiceInterface;
use Modules\Clinic\Http\Requests\TreatmentPlanStoreRequest;
use Modules\Clinic\Http\Requests\TreatmentPlanUpdateRequest;
use Modules\Clinic\Models\TreatmentPlan;
use Modules\Clinic\Models\TreatmentPlanExercise;
use Modules\Patient\Models\Patient;

class TreatmentPlanController extends Controller
{
    public function __construct(
        protected TreatmentPlanServiceInterface $service,
    ) {}

    public function index(Request $request): Response
    {
        $clinicId = auth('clinic')->user()->clinic_id;

        $plans = $this->service->list(
            $clinicId,
            $request->only(['search', 'status', 'patient_id', 'physio_area_id', 'clinic_user_id']),
        );

        return Inertia::render('clinic/treatment-plans/index', [
            'plans'       => $plans,
            'filters'     => $request->only(['search', 'status', 'patient_id', 'physio_area_id']),
            'statuses'    => TreatmentPlan::STATUSES,
            'patients'    => Patient::where('clinic_id', $clinicId)->orderBy('name')->get(['id', 'name']),
            'physioAreas' => PhysioArea::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(Request $request): Response
    {
        $clinicId = auth('clinic')->user()->clinic_id;

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
        $user = auth('clinic')->user();

        $data = array_merge($request->validated(), [
            'clinic_id'      => $user->clinic_id,
            'clinic_user_id' => $user->id,
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

        $clinicId = auth('clinic')->user()->clinic_id;

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
        $user   = auth('clinic')->user();
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
        $clinicId = auth('clinic')->user()->clinic_id;

        abort_if($plan->clinic_id !== $clinicId, 403, 'Acesso negado.');
    }
}
