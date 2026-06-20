<?php

namespace Modules\Clinic\Contracts;

use Illuminate\Support\Collection;
use Modules\Clinic\Services\DashboardScope;

interface DashboardRepositoryInterface
{
    /** Pacientes ativos no escopo (status ∉ óbito/cancelado/alta) — FR-006. */
    public function activePatientsCount(DashboardScope $scope): int;

    /** Consultas de hoje (timezone da clínica, exceto canceladas) — FR-007. */
    public function appointmentsTodayCount(DashboardScope $scope): int;

    /** Programas ativos de pacientes ativos vigentes no mês corrente — FR-008. */
    public function activeProgramsCount(DashboardScope $scope): int;

    /**
     * Catálogo de exercícios em vídeo disponível e nº de categorias — FR-009.
     *
     * @return array{count:int,categories_count:int}
     */
    public function availableExercises(): array;

    /**
     * Próximas consultas de hoje (passadas + futuras), ordenadas por horário — FR-010/010a.
     *
     * @return \Illuminate\Support\Collection<int,array<string,mixed>>
     */
    public function upcomingAppointmentsToday(DashboardScope $scope, int $limit = 5): Collection;

    /**
     * Aniversariantes do mês corrente, ordenados por dia — FR-012/013/014.
     *
     * @return array{total:int,items:array<int,array<string,mixed>>}
     */
    public function monthBirthdays(DashboardScope $scope): array;

    /**
     * Atividades da clínica no dia corrente, mais recentes primeiro — FR-022/024.
     *
     * @return array<int,array<string,mixed>>
     */
    public function recentActivities(int $clinicId, string $timezone): array;

    /**
     * Captação de pacientes por origem, comparando os últimos 3 anos — FR-015/016/017.
     *
     * @return array{years:int[],sources:array<int,array<string,mixed>>,totals_per_year:array<int,int>}
     */
    public function patientAcquisition(DashboardScope $scope): array;
}
