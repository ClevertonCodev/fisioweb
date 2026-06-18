<?php

namespace Modules\Clinic\Enums;

use Carbon\Carbon;

enum AppointmentStatus: string
{
    case Scheduled = 'scheduled';
    case Confirmed = 'confirmed';
    case NoShow    = 'no_show';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    /** Rótulo em pt-BR (espelha STATUS_COLORS do frontend). */
    public function label(): string
    {
        return match ($this) {
            self::Scheduled => 'Agendada',
            self::Confirmed => 'Confirmada',
            self::NoShow    => 'Não compareceu',
            self::Completed => 'Concluída',
            self::Cancelled => 'Cancelada',
        };
    }

    /** Cor de fundo do bloco no calendário (espelha o frontend). */
    public function color(): string
    {
        return match ($this) {
            self::Scheduled => '#3b82f6',
            self::Confirmed => '#22c55e',
            self::NoShow    => '#f59e0b',
            self::Completed => '#6b7280',
            self::Cancelled => '#ef4444',
        };
    }

    /** Estados terminais não admitem transição de saída. */
    public function isTerminal(): bool
    {
        return match ($this) {
            self::NoShow, self::Completed, self::Cancelled => true,
            default => false,
        };
    }

    /**
     * Regra de transição de status (FR-023).
     *
     * - scheduled → confirmed | cancelled | no_show* | completed*
     * - confirmed → cancelled | no_show* | completed*
     * - terminais (no_show, completed, cancelled) não saem
     * - (*) no_show e completed só após o horário de início
     */
    public function canTransitionTo(self $to, Carbon $startsAt, Carbon $now): bool
    {
        if ($this === $to) {
            return false;
        }

        if ($this->isTerminal()) {
            return false;
        }

        $requiresStarted = in_array($to, [self::NoShow, self::Completed], true);
        if ($requiresStarted && $now->lt($startsAt)) {
            return false;
        }

        return match ($this) {
            self::Scheduled => in_array($to, [self::Confirmed, self::Cancelled, self::NoShow, self::Completed], true),
            self::Confirmed => in_array($to, [self::Cancelled, self::NoShow, self::Completed], true),
            default         => false,
        };
    }
}
