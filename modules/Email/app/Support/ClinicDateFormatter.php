<?php

namespace Modules\Email\Support;

use Carbon\CarbonImmutable;
use Carbon\Exceptions\InvalidFormatException;
use Throwable;

final class ClinicDateFormatter
{
    public static function formatCalendarDate(?string $ymd, string $timezone): ?string
    {
        if (empty($ymd)) {
            return null;
        }

        $safeTimezone = self::safeTimezone($timezone);

        try {
            $date = CarbonImmutable::createFromFormat('!Y-m-d', $ymd, $safeTimezone);
        } catch (InvalidFormatException) {
            return null;
        }

        return $date ? $date->format('d/m/Y') : null;
    }

    public static function formatInstantDate(?string $instant, string $timezone): ?string
    {
        if (empty($instant)) {
            return null;
        }

        $safeTimezone = self::safeTimezone($timezone);

        try {
            $date = CarbonImmutable::parse($instant)->timezone($safeTimezone);
        } catch (Throwable) {
            return null;
        }

        return $date->format('d/m/Y');
    }

    public static function safeTimezone(string $timezone): string
    {
        return in_array($timezone, timezone_identifiers_list(), true)
            ? $timezone
            : (string) config('app.timezone', 'America/Sao_Paulo');
    }

    public static function singleLine(string $value): string
    {
        return (string) preg_replace('/\s+/u', ' ', trim($value));
    }
}
