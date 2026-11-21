<?php

namespace Modules\Clinic\Services;

use Modules\Clinic\Contracts\ClinicRepositoryInterface;
use Modules\Clinic\Contracts\Public\ClinicContactReadServiceInterface;
use Modules\Clinic\Data\Public\ClinicContactDTO;
use Modules\Clinic\Data\Public\ClinicProfessionalDTO;
use Modules\Clinic\Models\ClinicUser;

class ClinicContactReadService implements ClinicContactReadServiceInterface
{
    public function __construct(
        protected ClinicRepositoryInterface $clinics,
    ) {}

    public function findClinic(int $clinicId): ?ClinicContactDTO
    {
        $clinic = $this->clinics->find($clinicId);

        if (is_null($clinic)) {
            return null;
        }

        $timezone = $this->nullableTrim($clinic->timezone) ?? (string) config('app.timezone', 'America/Sao_Paulo');

        return new ClinicContactDTO(
            id: (int) $clinic->id,
            name: (string) $clinic->name,
            phone: $this->nullableTrim($clinic->phone),
            address: $this->nullableTrim($clinic->address),
            number: $this->nullableTrim($clinic->number),
            city: $this->nullableTrim($clinic->city),
            state: $this->nullableTrim($clinic->state),
            timezone: $timezone,
            appointmentReminderEmailEnabled: (bool) $clinic->appointment_reminder_email_enabled,
            cancelled: $clinic->isCancelled(),
        );
    }

    public function findProfessional(int $clinicId, int $clinicUserId): ?ClinicProfessionalDTO
    {
        $user = $this->clinics->findClinicUserForClinic($clinicId, $clinicUserId);

        if (is_null($user)) {
            return null;
        }

        $role = (string) $user->role;

        return new ClinicProfessionalDTO(
            id: (int) $user->id,
            clinicId: (int) $user->clinic_id,
            name: (string) $user->name,
            role: $role,
            roleLabel: ClinicUser::ROLES[$role] ?? '',
        );
    }

    private function nullableTrim(?string $value): ?string
    {
        if (is_null($value)) {
            return null;
        }

        $trimmed = trim($value);

        return empty($trimmed) ? null : $trimmed;
    }
}
