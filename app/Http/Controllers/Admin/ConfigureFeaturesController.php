<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Feature;
use App\Models\FeaturePlan;
use App\Models\Plan;
use Inertia\Inertia;
use Inertia\Response;

class ConfigureFeaturesController extends Controller
{
    public function index(): Response
    {
        $plans = Plan::query()->orderBy('name')->get(['id', 'name']);
        $features = Feature::query()->orderBy('name')->get(['id', 'name']);
        $featurePlans = FeaturePlan::query()
            ->with(['plan:id,name', 'feature:id,name'])
            ->orderBy('plan_id')
            ->orderBy('feature_id')
            ->get();

        return Inertia::render('admin/plans/configure-features', [
            'plans' => $plans,
            'features' => $features,
            'featurePlans' => $featurePlans,
        ]);
    }
}
