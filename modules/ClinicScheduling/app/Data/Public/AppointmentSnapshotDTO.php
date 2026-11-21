<?php

namespace Modules\ClinicScheduling\Data\Public;

use Carbon\CarbonImmutable;

final readonly class AppointmentSnapshotDTO
{
    private const LOCATION_HOME = 'Domicílio do paciente';

    private const LOCATION_CLINIC = 'Clínica';

    private const ROOM_SEPARATOR = ' · ';

    public function __construct(
        public int $id,
        public int $clinicId,
        public ?int $clinicUserId,
        public ?int $patientId,
        public ?string $title,
        public ?string $description,
        public ?string $location,
        public CarbonImmutable $startsAt,
        public CarbonImmutable $endsAt,
        public string $timezone,
        public ?string $googleEventId,
        public string $status,
    ) {}

    public function isHomeVisit(): bool
    {
        return trim((string) $this->location) === self::LOCATION_HOME;
    }

    /**
     * Sala dentro da clínica, lida do formato gravado pela agenda ("Clínica · Sala 3");
     * texto fora desse formato (Google, consultas antigas) volta como está.
     */
    public function room(): ?string
    {
        $text = trim((string) $this->location);

        if (empty($text) || $text === self::LOCATION_HOME || $text === self::LOCATION_CLINIC) {
            return null;
        }

        $prefix = self::LOCATION_CLINIC . self::ROOM_SEPARATOR;

        if (str_starts_with($text, $prefix)) {
            $room = trim(substr($text, strlen($prefix)));

            return empty($room) ? null : $room;
        }

        return $text;
    }
}
