<?php

namespace Modules\Clinic\Listeners;

use Modules\Clinic\Contracts\ActivityLoggerInterface;
use Modules\Clinic\Enums\ActivityType;
use Modules\ClinicScheduling\Events\AppointmentCancelled;
use Modules\ClinicScheduling\Events\AppointmentCompleted;
use Modules\ClinicScheduling\Events\AppointmentScheduled;

/**
 * Registra atividades de agendamento no log da clínica reagindo aos eventos
 * de ClinicScheduling (EDA). Substitui as chamadas diretas que o
 * AppointmentService fazia antes da extração (FR-020/022).
 */
class RecordSchedulingActivity
{
    public function __construct(
        protected ActivityLoggerInterface $activityLogger,
    ) {}

    public function onScheduled(AppointmentScheduled $event): void
    {
        $this->record($event->appointmentId, $event->clinicId, ActivityType::AppointmentScheduled, 'Consulta agendada');
    }

    public function onCompleted(AppointmentCompleted $event): void
    {
        $this->record($event->appointmentId, $event->clinicId, ActivityType::AppointmentCompleted, 'Consulta concluída');
    }

    public function onCancelled(AppointmentCancelled $event): void
    {
        $this->record($event->appointmentId, $event->clinicId, ActivityType::AppointmentCancelled, 'Consulta cancelada');
    }

    private function record(int $appointmentId, int $clinicId, ActivityType $type, string $baseDescription): void
    {
        if (empty($clinicId)) {
            return;
        }

        $appointment = \Modules\ClinicScheduling\Models\Appointment::with('patient')->find($appointmentId);
        $description = $baseDescription . ($appointment?->patient ? " — {$appointment->patient->name}" : '');

        $this->activityLogger->log($clinicId, $type, $description, $appointment);
    }
}
