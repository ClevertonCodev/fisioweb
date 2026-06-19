<?php

namespace Modules\Clinic\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Contracts\DashboardServiceInterface;
use Modules\Clinic\Http\Requests\OccupancyRateRequest;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Services\OccupancyRateService;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardServiceInterface $dashboardService,
    ) {}

    /**
     * Agregado inicial do dashboard (flags de papel + cards + próximas consultas),
     * escopado conforme o papel; apenas admin honra `scope=mine` (FR-002..010a).
     */
    public function index(Request $request): JsonResponse
    {
        $user  = Auth::guard('clinic')->user();
        $scope = $request->query('scope');

        return response()->json([
            'data' => $this->dashboardService->summary($user, is_string($scope) ? $scope : null),
        ]);
    }

    /**
     * Taxa de ocupação de um fisioterapeuta por granularidade (FR-019..021).
     * Admin/secretário escolhem o profissional; fisioterapeuta é forçado a si (SC-004).
     */
    public function occupancyRate(OccupancyRateRequest $request, OccupancyRateService $service): JsonResponse
    {
        $user        = Auth::guard('clinic')->user();
        $granularity = $request->validated('granularity');
        $targetId    = $this->resolveOccupancyUser($user, $request->validated('clinic_user_id'));

        $data = $service->compute($user->clinic, $targetId, $granularity);

        return response()->json([
            'data' => array_merge(['clinic_user_id' => $targetId, 'granularity' => $granularity], $data),
        ]);
    }

    private function resolveOccupancyUser(ClinicUser $user, ?int $requested): int
    {
        // Fisioterapeuta só vê a própria ocupação (param ignorado — FR-020/SC-004).
        if ($user->isPhysiotherapist()) {
            return $user->id;
        }

        // Admin/secretário escolhem qualquer profissional da própria clínica.
        if ($requested && ClinicUser::where('clinic_id', $user->clinic_id)->whereKey($requested)->exists()) {
            return $requested;
        }

        return $user->id;
    }
}
