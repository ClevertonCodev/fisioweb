<?php

namespace Modules\ClinicScheduling\Services;

use Carbon\CarbonImmutable;
use Modules\ClinicScheduling\Contracts\Public\AppointmentCancelFromExternalSourceInterface;
use Modules\ClinicScheduling\Contracts\Public\AppointmentReadServiceInterface;
use Modules\ClinicScheduling\Contracts\Public\AppointmentSyncWriteServiceInterface;
use Modules\ClinicScheduling\Contracts\Public\AppointmentUpsertFromExternalSourceInterface;
use Modules\ClinicScheduling\Data\Public\AppointmentExternalEventDTO;
use Modules\ClinicScheduling\Data\Public\AppointmentSnapshotDTO;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Models\Appointment;

class AppointmentExternalSyncService implements AppointmentCancelFromExternalSourceInterface, AppointmentReadServiceInterface, AppointmentSyncWriteServiceInterface, AppointmentUpsertFromExternalSourceInterface
{
    public function getSnapshotById(int $appointmentId): ?AppointmentSnapshotDTO
    {
        $appointment = Appointment::query()
            ->with('clinic:id,timezone')
            ->find($appointmentId);

        if (is_null($appointment)) {
            return null;
        }

        return new AppointmentSnapshotDTO(
            id: (int) $appointment->id,
            clinicId: (int) $appointment->clinic_id,
            clinicUserId: !is_null($appointment->clinic_user_id) ? (int) $appointment->clinic_user_id : null,
            patientId: !is_null($appointment->patient_id) ? (int) $appointment->patient_id : null,
            title: $appointment->title,
            description: $appointment->description,
            location: $appointment->location,
            startsAt: CarbonImmutable::parse($appointment->starts_at),
            endsAt: CarbonImmutable::parse($appointment->ends_at),
            timezone: $appointment->clinic?->timezone ?: config('app.timezone', 'America/Sao_Paulo'),
            googleEventId: $appointment->google_event_id,
            status: $appointment->status->value,
        );
    }

    public function findIdByExternalEventId(int $clinicId, string $externalEventId): ?int
    {
        $id = Appointment::query()
            ->where('clinic_id', $clinicId)
            ->where('google_event_id', $externalEventId)
            ->value('id');

        return !is_null($id) ? (int) $id : null;
    }

    public function recordGoogleEventId(int $appointmentId, string $googleEventId, CarbonImmutable $syncedAt): void
    {
        $appointment = Appointment::query()->findOrFail($appointmentId);

        $appointment->forceFill([
            'google_event_id' => $googleEventId,
            'last_synced_at'  => $syncedAt,
        ])->saveQuietly();
    }

    public function upsertFromExternalSource(AppointmentExternalEventDTO $event): int
    {
        $payload = [
            'clinic_id'       => $event->clinicId,
            'clinic_user_id'  => $event->clinicUserId,
            'patient_id'      => $event->patientId,
            'title'           => $event->title,
            'description'     => $event->description,
            'location'        => $event->location,
            'starts_at'       => $event->startsAt,
            'ends_at'         => $event->endsAt,
            'status'          => AppointmentStatus::from($event->status),
            'source'          => $event->source,
            'google_event_id' => $event->externalEventId,
            'last_synced_at'  => $event->syncedAt,
        ];

        $existing = Appointment::query()
            ->where('clinic_id', $event->clinicId)
            ->where('google_event_id', $event->externalEventId)
            ->first();

        if (!is_null($existing)) {
            $existing->forceFill($payload)->saveQuietly();

            return (int) $existing->id;
        }

        $created = null;

        Appointment::withoutEvents(function () use ($payload, &$created): void {
            $created = Appointment::query()->create($payload);
        });

        return (int) $created->id;
    }

    public function cancelFromExternalSource(int $appointmentId, CarbonImmutable $occurredAt): void
    {
        $appointment = Appointment::query()->findOrFail($appointmentId);

        $appointment->forceFill([
            'status'         => AppointmentStatus::Cancelled,
            'last_synced_at' => $occurredAt,
        ])->saveQuietly();
    }
}
