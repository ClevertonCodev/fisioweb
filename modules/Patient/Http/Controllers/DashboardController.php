<?php

namespace Modules\Patient\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Clinic\Models\Clinic;
use Modules\Patient\Models\Patient;

class DashboardController extends Controller
{
    public function index(string $clinic): Response
    {
        /** @var Patient $patient */
        $patient = Auth::guard('patient')->user();

        $clinicModel = Clinic::where('slug', $clinic)->firstOrFail();

        // Garante que o paciente pertence a essa clínica
        abort_unless(
            $patient->clinics()->where('clinics.id', $clinicModel->id)->exists(),
            403,
            'Você não tem acesso a esta clínica.'
        );

        return Inertia::render('Patient/Dashboard', [
            'clinic'  => $clinicModel->only('id', 'name', 'slug'),
            'patient' => $patient->only('id', 'name', 'email'),
        ]);
    }
}
