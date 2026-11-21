<?php

namespace Modules\Email\Contracts;

use Carbon\CarbonImmutable;

interface AppointmentReminderRepositoryInterface
{
    /**
     * Grava o lembrete deste horário da consulta, se ainda não existe.
     *
     * @return bool `false` quando o horário já tinha sido lembrado
     */
    public function reserve(int $clinicId, int $appointmentId, CarbonImmutable $startsAt): bool;

    public function release(int $appointmentId, CarbonImmutable $startsAt): void;
}
