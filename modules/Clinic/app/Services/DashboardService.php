<?php

namespace Modules\Clinic\Services;

use Modules\Clinic\Contracts\DashboardRepositoryInterface;
use Modules\Clinic\Contracts\DashboardServiceInterface;
use Modules\Clinic\Models\ClinicUser;

class DashboardService implements DashboardServiceInterface
{
    public function __construct(
        protected DashboardRepositoryInterface $repository,
    ) {}

    public function summary(ClinicUser $user, ?string $scope = null): array
    {
        $dashboardScope = DashboardScope::fromUser($user, $scope);

        return [
            'viewer' => [
                'role'                    => $dashboardScope->role,
                'can_toggle_scope'        => $dashboardScope->canToggleScope(),
                'can_choose_professional' => $dashboardScope->canChooseProfessional(),
                'can_view_activities'     => $dashboardScope->canViewActivities(),
                'current_scope'           => $dashboardScope->currentScope(),
            ],
            'cards' => [
                'active_patients'     => $this->repository->activePatientsCount($dashboardScope),
                'appointments_today'  => $this->repository->appointmentsTodayCount($dashboardScope),
                'active_programs'     => $this->repository->activeProgramsCount($dashboardScope),
                'available_exercises' => $this->repository->availableExercises(),
            ],
            'upcoming_appointments' => $this->repository->upcomingAppointmentsToday($dashboardScope)->all(),
            'birthdays'             => $this->repository->monthBirthdays($dashboardScope),
        ];
    }
}
