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

    /**
     * @return array{clinicId: int, patientId: int}|null
     */
    public static function parse(string $token): ?array
    {
        if (!preg_match('/^([1-9][0-9]{0,18})\.([1-9][0-9]{0,18})\.([0-9a-f]{64})$/', $token, $parts)) {
            return null;
        }

        $clinicId  = (int) $parts[1];
        $patientId = (int) $parts[2];

        if (!hash_equals(self::signature($clinicId, $patientId), $parts[3])) {
            return null;
        }

        return ['clinicId' => $clinicId, 'patientId' => $patientId];
    }

    private static function signature(int $clinicId, int $patientId): string
    {
        return hash_hmac('sha256', "appointment-reminder-unsubscribe|{$clinicId}|{$patientId}", (string) config('app.key'));
    }
}
