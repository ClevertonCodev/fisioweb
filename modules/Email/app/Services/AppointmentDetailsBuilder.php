<?php

namespace Modules\Email\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Str;
use Modules\Clinic\Contracts\Public\ClinicContactReadServiceInterface;
use Modules\Clinic\Data\Public\ClinicContactDTO;
use Modules\ClinicScheduling\Data\Public\AppointmentSnapshotDTO;

class AppointmentDetailsBuilder
{
    public function __construct(
        protected ClinicContactReadServiceInterface $clinics,
    ) {}

    /**
     * @return list<array{0: string, 1: string}>
     */
    public function rows(
        AppointmentSnapshotDTO $appointment,
        ClinicContactDTO $clinic,
        CarbonImmutable $startsAt,
        CarbonImmutable $endsAt,
        bool $withPlace,
        ?string $dayLabel = null,
    ): array {
        $weekday = $startsAt->locale('pt_BR')->isoFormat('dddd');
        $date    = is_null($dayLabel)
            ? Str::ucfirst($weekday) . ", {$startsAt->format('d/m/Y')}"
            : "{$dayLabel}, {$weekday}, {$startsAt->format('d/m/Y')}";

        $rows = [
            ['Data', $date],
            ['Horário', "{$startsAt->format('H:i')} às {$endsAt->format('H:i')}"],
        ];

        if (!is_null($appointment->clinicUserId)) {
            $professional = $this->clinics->findProfessional($clinic->id, $appointment->clinicUserId);

            if (!is_null($professional) && !empty(trim($professional->name))) {
                $rows[] = ['Profissional', trim($professional->name)];
            }
        }

        if (!$withPlace) {
            return $rows;
        }

        $place = $appointment->isHomeVisit()
            ? 'Atendimento em domicílio'
            : implode(' · ', array_values(array_filter(
                [(string) $appointment->room(), (string) $clinic->formattedAddress()],
                fn (string $part) => !empty($part),
            )));

        if (!empty($place)) {
            $rows[] = ['Local', $place];
        }

        return $rows;
    }
}
