<?php

namespace Modules\ClinicScheduling\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Modules\ClinicScheduling\Models\Appointment;

/**
 * Avisa fisioterapeuta e paciente que a sessão foi agendada (FR-020).
 *
 * A entrega efetiva (e-mail/SMS/WhatsApp) será definida depois — por ora
 * o Job apenas registra a intenção de notificar. O canal entra numa
 * feature futura.
 */
class AppointmentScheduledNotificationJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public array $backoff = [10, 30, 60];

    public function __construct(
        public int $appointmentId,
    ) {}

    public function handle(): void
    {
        $appointment = Appointment::with(['patient', 'clinicUser'])->find($this->appointmentId);

        if (is_null($appointment)) {
            return;
        }

        // TODO: definir canal de entrega (e-mail/SMS/WhatsApp) em feature futura.
        logInfo('Notificação de agendamento enfileirada.', [
            'appointment_id' => $appointment->id,
            'clinic_user_id' => $appointment->clinic_user_id,
            'patient_id'     => $appointment->patient_id,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        logError('Falha ao processar notificação de agendamento.', [
            'appointment_id' => $this->appointmentId,
            'message'        => $exception->getMessage(),
        ]);
    }
}
