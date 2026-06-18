<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Contracts\AppointmentServiceInterface;
use Modules\Clinic\Http\Requests\StoreAppointmentRequest;
use Modules\Clinic\Http\Requests\UpdateAppointmentRequest;
use Modules\Clinic\Http\Requests\UpdateAppointmentStatusRequest;
use Modules\Clinic\Models\Appointment;

class AppointmentController extends Controller
{
    public function __construct(
        protected AppointmentServiceInterface $appointmentService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Appointment::class);

        $user    = Auth::guard('clinic')->user();
        $filters = $request->only(['from', 'to', 'clinic_user_id', 'status']);

        $appointments = $this->appointmentService->listForUser($user, $filters);

        return response()->json(['data' => $appointments]);
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $this->authorize('create', Appointment::class);

        $data = array_merge($request->validated(), [
            'clinic_id' => Auth::guard('clinic')->user()->clinic_id,
        ]);

        $appointment = $this->appointmentService->create($data);

        return response()->json(['data' => $appointment], 201);
    }

    public function show(Appointment $appointment): JsonResponse
    {
        $this->authorizeClinic($appointment);
        $this->authorize('view', $appointment);

        return response()->json(['data' => $appointment->load(['patient', 'clinicUser'])]);
    }

    public function update(UpdateAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        $this->authorizeClinic($appointment);
        $this->authorize('update', $appointment);

        $updated = $this->appointmentService->update($appointment->id, $request->validated());

        return response()->json(['data' => $updated]);
    }

    public function updateStatus(UpdateAppointmentStatusRequest $request, Appointment $appointment): JsonResponse
    {
        $this->authorizeClinic($appointment);
        $this->authorize('update', $appointment);

        $updated = $this->appointmentService->updateStatus($appointment->id, $request->status());

        return response()->json(['data' => $updated]);
    }

    public function cancel(Appointment $appointment): JsonResponse
    {
        $this->authorizeClinic($appointment);
        $this->authorize('cancel', $appointment);

        $cancelled = $this->appointmentService->cancel($appointment->id);

        return response()->json(['data' => $cancelled]);
    }

    /**
     * Isolamento multi-tenant: consulta de outra clínica não existe para o
     * usuário (404), independente do bypass de admin no Gate::before (FR-021).
     */
    private function authorizeClinic(Appointment $appointment): void
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        abort_if((int) $appointment->clinic_id !== (int) $clinicId, 404, 'Consulta não encontrada.');
    }
}
