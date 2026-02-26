<?php

namespace Modules\Clinic\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Clinic\Http\Requests\PatientStoreRequest;
use Modules\Clinic\Http\Requests\PatientUpdateRequest;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Contracts\PatientServiceInterface;
use Modules\Patient\Models\Patient;

class PatientController extends BaseController
{
    public function __construct(
        private PatientServiceInterface $service,
    ) {
        parent::__construct();
    }

    public function index(): Response
    {
        $clinicId = $this->clinic->id;
        $filters  = request()->only(['search', 'is_active']);
        $patients = $this->service->list($clinicId, $filters);

        // Resolve o nome de quem cadastrou o paciente nesta clínica (via pivot)
        $registeredByIds = $patients->getCollection()
            ->map(fn ($p) => $p->clinics->first()?->pivot->registered_by)
            ->filter()
            ->unique();

        if ($registeredByIds->isNotEmpty()) {
            $clinicUsers = ClinicUser::whereIn('id', $registeredByIds)->pluck('name', 'id');
            $patients->getCollection()->each(function ($patient) use ($clinicUsers) {
                $registeredBy                   = $patient->clinics->first()?->pivot->registered_by;
                $patient->registered_by_name    = $registeredBy ? $clinicUsers->get($registeredBy) : null;
                $patient->registered_by_initial = $registeredBy && $clinicUsers->get($registeredBy)
                    ? mb_strtoupper(mb_substr($clinicUsers->get($registeredBy), 0, 1))
                    : null;
            });
        }

        return Inertia::render('clinic/patients/index', [
            'patients' => $patients,
            'filters'  => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('clinic/patients/create');
    }

    public function store(PatientStoreRequest $request): RedirectResponse
    {
        $this->service->findOrCreateAndLink(
            $request->validated(),
            $this->clinic->id,
            $this->user->id
        );

        return redirect()
            ->route('clinic.patients.index')
            ->with('flash.success', 'Paciente cadastrado com sucesso.');
    }

    public function show(int $id): Response
    {
        $patient = $this->findPatientForClinic($id);

        $patient->load(['treatmentPlans' => fn ($q) => $q->where('clinic_id', $this->clinic->id)->latest()]);

        return Inertia::render('clinic/patients/show', [
            'patient' => $patient,
        ]);
    }

    public function edit(int $id): Response
    {
        $patient = $this->findPatientForClinic($id);

        return Inertia::render('clinic/patients/edit', [
            'patient' => $patient,
        ]);
    }

    public function update(PatientUpdateRequest $request, int $id): RedirectResponse
    {
        $this->findPatientForClinic($id);

        $this->service->update($id, $request->validated());

        return redirect()
            ->route('clinic.patients.show', $id)
            ->with('flash.success', 'Paciente atualizado com sucesso.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $this->findPatientForClinic($id);

        $this->service->unlinkFromClinic($id, $this->clinic->id);

        return redirect()
            ->route('clinic.patients.index')
            ->with('flash.success', 'Paciente desvinculado da clínica.');
    }

    /**
     * Busca o paciente e garante que ele pertence à clínica atual.
     */
    private function findPatientForClinic(int $id): Patient
    {
        $patient = Patient::whereHas('clinics', fn ($q) => $q->where('clinics.id', $this->clinic->id))
            ->findOrFail($id);

        return $patient;
    }
}
