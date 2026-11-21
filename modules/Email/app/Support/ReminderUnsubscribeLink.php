<?php

namespace Modules\Email\Support;

final class ReminderUnsubscribeLink
{
    private const PATH = '/lembretes/sair';

    public static function token(int $clinicId, int $patientId): string
    {
        return "{$clinicId}.{$patientId}." . self::signature($clinicId, $patientId);
    }

    public static function url(int $clinicId, int $patientId): string
    {
        return rtrim((string) config('app.url'), '/') . self::PATH . '?'
            . http_build_query(['token' => self::token($clinicId, $patientId)]);
    }

    private static function signature(int $clinicId, int $patientId): string
    {
        return hash_hmac('sha256', "appointment-reminder-unsubscribe|{$clinicId}|{$patientId}", (string) config('app.key'));
    }
}
