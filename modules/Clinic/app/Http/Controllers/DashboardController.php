<?php

namespace Modules\Clinic\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ExerciseFavorite;
use Modules\Clinic\Models\TreatmentPlan;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $clinicUser          = Auth::guard('clinic')->user();
        $clinicId            = $clinicUser->clinic_id;
        $patientsCount       = Clinic::find($clinicId)?->patients()->count() ?? 0;
        $treatmentPlansCount = TreatmentPlan::where('clinic_id', $clinicId)->count();
        $activePlansCount    = TreatmentPlan::where('clinic_id', $clinicId)->where('status', TreatmentPlan::STATUS_ACTIVE)->count();
        $favoritesCount      = ExerciseFavorite::where('clinic_user_id', $clinicUser->id)->count();

        return response()->json([
            'data' => [
                'patients_count'        => $patientsCount,
                'treatment_plans_count' => $treatmentPlansCount,
                'active_plans_count'    => $activePlansCount,
                'favorites_count'       => $favoritesCount,
            ],
        ]);
    }
}
