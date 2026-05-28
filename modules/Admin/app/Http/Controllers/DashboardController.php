<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\Feature;
use Modules\Admin\Models\Plan;
use Modules\Clinic\Models\Clinic;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $data = [
            'clinics_count'   => Clinic::count(),
            'plans_count'     => Plan::count(),
            'features_count'  => Feature::count(),
            'exercises_count' => Exercise::count(),
        ];

        return response()->json(['data' => $data]);
    }
}
