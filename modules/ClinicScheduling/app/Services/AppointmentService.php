<?php

namespace Modules\ClinicScheduling\Services;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Validation\ValidationException;
use Modules\ClinicScheduling\Contracts\AppointmentRepositoryInterface;
use Modules\ClinicScheduling\Contracts\AppointmentServiceInterface;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Events\AppointmentCancelled;
use Modules\ClinicScheduling\Events\AppointmentCompleted;
use Modules\ClinicScheduling\Events\AppointmentRescheduled;
use Modules\ClinicScheduling\Events\AppointmentScheduled;
use Modules\ClinicScheduling\Jobs\AppointmentScheduledNotificationJob;
use Modules\ClinicScheduling\Models\Appointment;

class AppointmentService implements AppointmentServiceInterface
{
    /** Versão dos eventos de integração de agendamento. */
    private const EVENT_VERSION = 1;

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

        $appointment = $appointment->load(['patient', 'clinicUser']);

        $this->dispatchEvent(new AppointmentScheduled(...$this->eventPayload($appointment)));

        return $appointment;
    }

    public function update(int $id, array $data): Appointment
    {
        // Status é alterado apenas via updateStatus() (FR-023).
        unset($data['status']);

        $appointment = $this->repository->update($id, $data)->load(['patient', 'clinicUser']);

        // Reagendamento dispara em qualquer update bem-sucedido (clarificação).
        $this->dispatchEvent(new AppointmentRescheduled(...$this->eventPayload($appointment)));

        return $appointment;
    }

    public function updateStatus(int $id, AppointmentStatus $status): Appointment
    {
        $appointment = $this->repository->findOrFail($id);

        if (!$appointment->status->canTransitionTo($status, $appointment->starts_at, now())) {
            throw ValidationException::withMessages([
                'status' => "Transição de status inválida: {$appointment->status->value} → {$status->value}.",
            ]);
        }

        $updated = $this->repository->update($id, ['status' => $status])->load(['patient', 'clinicUser']);

        if ($status === AppointmentStatus::Completed) {
            $this->dispatchEvent(new AppointmentCompleted(...$this->eventPayload($updated)));
        }

        if ($status === AppointmentStatus::Cancelled) {
            $this->dispatchEvent(new AppointmentCancelled(...$this->eventPayload($updated)));
        }

        return $updated;
    }

    public function cancel(int $id): Appointment
    {
        return $this->updateStatus($id, AppointmentStatus::Cancelled);
    }

    public function listForUser($user, array $filters = []): Collection
    {
        // Fisioterapeuta só enxerga a própria agenda (FR-009).
        if ($user->isPhysiotherapist()) {
            $filters['clinic_user_id'] = $user->id;
        }

        return $this->repository->listForCalendar($user->clinic_id, $filters);
    }

    /**
     * Snapshot mínimo do agendamento para os eventos de integração.
     * Ordem casa com o construtor dos eventos (IDs + primitivos + occurredAt).
     *
     * @return array{int,int,int,?int,?int,?int,string,string,string,CarbonImmutable}
     */
    private function eventPayload(Appointment $appointment): array
    {
        return [
            self::EVENT_VERSION,
            (int) $appointment->id,
            (int) $appointment->clinic_id,
            !is_null($appointment->patient_id) ? (int) $appointment->patient_id : null,
            !is_null($appointment->clinic_user_id) ? (int) $appointment->clinic_user_id : null,
            Auth::guard('clinic')->id(),
            (string) $appointment->starts_at?->toIso8601String(),
            (string) $appointment->ends_at?->toIso8601String(),
            $appointment->status->value,
            CarbonImmutable::now(),
        ];
    }

    private function dispatchEvent(object $event): void
    {
        DB::afterCommit(fn () => Event::dispatch($event));
    }
}
