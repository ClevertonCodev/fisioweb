<?php

namespace Modules\ClinicScheduling\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\ClinicScheduling\Contracts\AppointmentServiceInterface;
use Modules\ClinicScheduling\Http\Requests\PatientHistoryRequest;
use Modules\ClinicScheduling\Http\Requests\StoreAppointmentRequest;
use Modules\ClinicScheduling\Http\Requests\UpdateAppointmentRequest;
use Modules\ClinicScheduling\Http\Requests\UpdateAppointmentStatusRequest;
use Modules\ClinicScheduling\Models\Appointment;

class AppointmentController extends ClinicAuthenticatedController
{
    public function __construct(
        protected AppointmentServiceInterface $appointmentService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Appointment::class);

        $user    = $this->clinicUser();
        $filters = $request->only(['from', 'to', 'clinic_user_id', 'status']);

        $appointments = $this->appointmentService->listForUser($user, $filters);

        return response()->json(['data' => $appointments]);
    }

    public function patientHistory(PatientHistoryRequest $request, int $patient): JsonResponse
    {
        $this->authorize('viewAny', Appointment::class);

        $history = $this->appointmentService->historyForPatient($this->clinicUser(), $patient, $request->perPage());

        return response()->json([
            'data' => $history->through(fn (Appointment $appointment) => [
                'id'               => $appointment->id,
                'starts_at'        => $appointment->starts_at?->toIso8601String(),
                'ends_at'          => $appointment->ends_at?->toIso8601String(),
                'title'            => $appointment->title,
                'clinic_user_name' => $appointment->clinicUser?->name,
                'status'           => $appointment->status->value,
            ]),
        ]);
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $this->authorize('create', Appointment::class);

        $data = array_merge($request->validated(), [
            'clinic_id' => $this->clinicId(),
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
        abort_if((int) $appointment->clinic_id !== $this->clinicId(), 404, 'Consulta não encontrada.');
    }
}
