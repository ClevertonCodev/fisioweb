<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Admin\Models\Feature;
use Modules\Admin\Models\FeaturePlan;
use Modules\Admin\Models\Plan;

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
