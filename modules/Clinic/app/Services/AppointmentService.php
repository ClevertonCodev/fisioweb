<?php

namespace Modules\Clinic\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;
use Modules\Clinic\Contracts\AppointmentRepositoryInterface;
use Modules\Clinic\Contracts\AppointmentServiceInterface;
use Modules\Clinic\Enums\AppointmentStatus;
use Modules\Clinic\Jobs\AppointmentScheduledNotificationJob;
use Modules\Clinic\Models\Appointment;
use Modules\Clinic\Models\ClinicUser;
use Modules\GoogleCalendar\Jobs\SyncAppointmentToGoogleJob;

class AppointmentService implements AppointmentServiceInterface
{
    public function __construct(
        protected AppointmentRepositoryInterface $repository,
    ) {}

    public function create(array $data): Appointment
    {
        $data['status'] = AppointmentStatus::Scheduled;
        $data['source'] = Appointment::SOURCE_SYSTEM;

        $appointment = $this->repository->create($data);

        // Notifica fisioterapeuta + paciente após o commit (FR-020).
        AppointmentScheduledNotificationJob::dispatch($appointment->id)->afterCommit();

        $this->pushToGoogle($appointment);

        return $appointment->load(['patient', 'clinicUser']);
    }

    public function update(int $id, array $data): Appointment
    {
        // Status é alterado apenas via updateStatus() (FR-023).
        unset($data['status']);

        $appointment = $this->repository->update($id, $data);

        $this->pushToGoogle($appointment);

        return $appointment->load(['patient', 'clinicUser']);
    }

    public function updateStatus(int $id, AppointmentStatus $status): Appointment
    {
        $appointment = $this->repository->findOrFail($id);

        if (!$appointment->status->canTransitionTo($status, $appointment->starts_at, now())) {
            throw ValidationException::withMessages([
                'status' => "Transição de status inválida: {$appointment->status->value} → {$status->value}.",
            ]);
        }

        return $this->repository->update($id, ['status' => $status])->load(['patient', 'clinicUser']);
    }

    public function cancel(int $id): Appointment
    {
        $appointment = $this->updateStatus($id, AppointmentStatus::Cancelled);

        // Remove o evento correspondente no Google (FR-018/FR-024).
        $user = $appointment->clinicUser;
        if ($user?->isGoogleConnected() && $appointment->google_event_id) {
            SyncAppointmentToGoogleJob::dispatch(
                $appointment->id,
                SyncAppointmentToGoogleJob::ACTION_DELETE,
                $appointment->google_event_id,
            )->afterCommit();
        }

        return $appointment;
    }

    /**
     * Despacha o push (criar/atualizar) do evento no Google Calendar do
     * responsável, quando ele tem a conta conectada (FR-014/FR-015).
     */
    private function pushToGoogle(Appointment $appointment): void
    {
        $user = $appointment->clinicUser ?: ClinicUser::find($appointment->clinic_user_id);

        if ($user?->isGoogleConnected()) {
            SyncAppointmentToGoogleJob::dispatch($appointment->id)->afterCommit();
        }
    }

    public function listForUser(ClinicUser $user, array $filters = []): Collection
    {
        // Fisioterapeuta só enxerga a própria agenda (FR-009).
        if ($user->isPhysiotherapist()) {
            $filters['clinic_user_id'] = $user->id;
        }

        return $this->repository->listForCalendar($user->clinic_id, $filters);
    }
}
