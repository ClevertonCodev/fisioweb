<?php

namespace Modules\ClinicScheduling\Contracts\Public;

use Carbon\CarbonInterface;

/**
 * Contrato público de leitura de agendamento para consumidores de outros
 * módulos (ex.: Dashboard e taxa de ocupação no módulo Clinic). Consumidores
 * dependem apenas desta interface, nunca do Model/Repository privado.
 */
interface SchedulingReadServiceInterface
{
    /** Total de consultas não-canceladas de hoje (timezone da clínica). */
    public function appointmentsTodayCount(int $clinicId, ?int $clinicUserId, string $timezone): int;

    /**
     * Próximas consultas de hoje, no shape consumido pelo dashboard.
     *
     * @return array<int, array{
     *   id:int, patient_name:string, patient_photo_url:?string,
     *   title:?string, starts_at:?string, status:?string
     * }>
     */
    public function upcomingAppointmentsToday(int $clinicId, ?int $clinicUserId, string $timezone, int $limit = 5): array;

    /**
     * Intervalos (início/fim) de consultas não-canceladas de um profissional
     * num período, para cálculo da taxa de ocupação.
     *
     * @return array<int, array{starts_at: CarbonInterface, ends_at: CarbonInterface}>
     */
    public function occupancyIntervals(int $clinicId, int $clinicUserId, CarbonInterface $rangeStart, CarbonInterface $rangeEnd): array;
}
