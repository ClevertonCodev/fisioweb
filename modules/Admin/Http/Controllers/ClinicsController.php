<?php

namespace Modules\Admin\Http\Controllers;

use App\Helpers\ValidationHelper;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Admin\Http\Requests\StoreClinicRequest;
use Modules\Admin\Http\Requests\UpdateClinicRequest;
use Modules\Admin\Models\Plan;
use Modules\Clinic\Models\Clinic;

class ClinicsController extends Controller
{
    /**
     * Display the clinics page.
     */
    public function index(Request $request): Response
    {
        $query = Clinic::with('plan');

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                if (is_numeric($search)) {
                    $q->where('id', $search);
                } else {
                    $q->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('document', 'like', "%{$search}%");
                }
            });
        }

        if ($request->filled('plan_id')) {
            $query->where('plan_id', $request->get('plan_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->get('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->get('date_to'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $clinics = $query->orderBy('created_at', 'desc')
            ->paginate(3)
            ->withQueryString();

        $plans = Plan::orderBy('name')->get();

        return Inertia::render('admin/clinics/index', [
            'clinics' => $clinics,
            'plans'   => $plans,
            'filters' => $request->only(['search', 'plan_id', 'date_from', 'date_to', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new clinic.
     */
    public function create(): Response
    {
        $plans = Plan::orderBy('name')->get();

        return Inertia::render('admin/clinics/create', [
            'plans' => $plans,
        ]);
    }

    /**
     * Store a newly created clinic in storage.
     */
    public function store(StoreClinicRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $validated['slug']    = $this->resolveSlug($validated['name'], $validated['slug'] ?? null);
        $validated['status']  = (int) $validated['status'];
        $rawPlanId            = $request->input('plan_id');
        $validated['plan_id'] = $this->resolvePlanId($rawPlanId);

        if ($validated['plan_id'] === null && $rawPlanId !== null && $rawPlanId !== '') {
            return redirect()
                ->back()
                ->withErrors(['plan_id' => 'O plano selecionado não existe.'])
                ->withInput();
        }

        Clinic::create($validated);

        return redirect()
            ->route('admin.clinics.index')
            ->with('success', 'Clínica criada com sucesso!');
    }

    /**
     * Display the specified clinic.
     */
    public function show(Clinic $clinic): Response
    {
        $clinic->load('plan');

        return Inertia::render('admin/clinics/show', [
            'clinic' => $clinic,
        ]);
    }

    /**
     * Show the form for editing the specified clinic.
     */
    public function edit(Clinic $clinic): Response
    {
        $clinic->load('plan');
        $plans = Plan::orderBy('name')->get();

        return Inertia::render('admin/clinics/edit', [
            'clinic' => $clinic,
            'plans'  => $plans,
        ]);
    }

    /**
     * Update the specified clinic in storage.
     */
    public function update(UpdateClinicRequest $request, Clinic $clinic): RedirectResponse
    {
        $validated = $request->validated();

        $validated['slug']    = $this->resolveSlug($validated['name'], $validated['slug'] ?? null, $clinic->id);
        $validated['status']  = (int) $validated['status'];
        $rawPlanId            = $request->input('plan_id');
        $validated['plan_id'] = $this->resolvePlanId($rawPlanId);

        if ($validated['plan_id'] === null && $rawPlanId !== null && $rawPlanId !== '') {
            return redirect()
                ->back()
                ->withErrors(['plan_id' => 'O plano selecionado não existe.'])
                ->withInput();
        }

        $clinic->update($validated);

        return redirect()
            ->route('admin.clinics.show', $clinic)
            ->with('success', 'Clínica atualizada com sucesso!');
    }

    /**
     * Cancel the clinic (never delete; set status to cancelled).
     */
    public function destroy(Clinic $clinic): RedirectResponse
    {
        if ($clinic->status === Clinic::STATUS_CANCELLED) {
            return redirect()
                ->route('admin.clinics.index')
                ->with('error', 'Esta clínica já está cancelada.');
        }

        $clinic->update(['status' => Clinic::STATUS_CANCELLED]);

        return redirect()
            ->route('admin.clinics.index')
            ->with('success', 'Clínica cancelada com sucesso!');
    }

    /**
     * Reactivate a cancelled clinic (set status to active).
     */
    public function reactivate(Clinic $clinic): RedirectResponse
    {
        if ($clinic->status !== Clinic::STATUS_CANCELLED) {
            return redirect()
                ->route('admin.clinics.show', $clinic)
                ->with('error', 'Esta clínica não está cancelada.');
        }

        $clinic->update(['status' => Clinic::STATUS_ACTIVE]);

        return redirect()
            ->route('admin.clinics.show', $clinic)
            ->with('success', 'Clínica reativada com sucesso!');
    }

    private function resolveSlug(string $name, ?string $slug, ?int $ignoreClinicId = null): string
    {
        $baseSlug = !empty($slug) ? $slug : ValidationHelper::generateSlug($name);
        $query    = Clinic::where('slug', $baseSlug);
        if ($ignoreClinicId !== null) {
            $query->where('id', '!=', $ignoreClinicId);
        }
        if (!$query->exists()) {
            return $baseSlug;
        }
        $counter = 1;
        do {
            $candidate = $baseSlug . '-' . $counter;
            $q         = Clinic::where('slug', $candidate);
            if ($ignoreClinicId !== null) {
                $q->where('id', '!=', $ignoreClinicId);
            }
            $counter++;
        } while ($q->exists());

        return $candidate;
    }

    private function resolvePlanId(mixed $planId): ?int
    {
        if (empty($planId)) {
            return null;
        }
        $id = (int) $planId;

        return Plan::where('id', $id)->exists() ? $id : null;
    }
}
