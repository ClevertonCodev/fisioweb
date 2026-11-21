<?php

namespace Modules\Email\Support;

use Modules\Clinic\Data\Public\ClinicContactDTO;

final class GoogleMapsLink
{
    public static function forClinic(ClinicContactDTO $clinic): ?string
    {
        $street = trim((string) $clinic->address);

        if (empty($street)) {
            return null;
        }

        $parts = array_values(array_filter(
            array_map(fn (?string $part) => trim((string) $part), [$street, $clinic->number, $clinic->city, $clinic->state]),
            fn (string $part) => !empty($part),
        ));

        return 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode(implode(', ', $parts));
    }
}
