<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Admin\Models\BodyRegion;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;

class ExerciseController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Exercise::query()
            ->with(['physioArea', 'bodyRegion', 'videos'])
            ->active()
            ->latest();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('muscle_group', 'like', "%{$search}%")
                    ->orWhere('therapeutic_goal', 'like', "%{$search}%");
            });
        }

        if ($areaIds = $request->input('physio_area_id')) {
            $query->whereIn('physio_area_id', (array) $areaIds);
        }

        if ($regionIds = $request->input('body_region_id')) {
            $query->whereIn('body_region_id', (array) $regionIds);
        }

        if ($difficulties = $request->input('difficulty_level')) {
            $query->whereIn('difficulty_level', (array) $difficulties);
        }

        if ($forms = $request->input('movement_form')) {
            $query->whereIn('movement_form', (array) $forms);
        }

        $exercises = $query->paginate(24)->withQueryString();

        return Inertia::render('clinic/exercises/index', [
            'exercises'     => $exercises,
            'filters'       => $request->only(['search', 'physio_area_id', 'body_region_id', 'difficulty_level', 'movement_form']),
            'physioAreas'   => PhysioArea::orderBy('name')->get(['id', 'name']),
            'bodyRegions'   => BodyRegion::orderBy('name')->get(['id', 'name']),
            'difficulties'  => Exercise::DIFFICULTIES,
            'movementForms' => Exercise::MOVEMENT_FORMS,
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $query = Exercise::query()
            ->with(['physioArea', 'bodyRegion'])
            ->active()
            ->latest();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('muscle_group', 'like', "%{$search}%")
                    ->orWhere('therapeutic_goal', 'like', "%{$search}%");
            });
        }

        if ($areaId = $request->input('physio_area_id')) {
            $query->where('physio_area_id', $areaId);
        }

        return response()->json([
            'data' => $query->limit(20)->get(),
        ]);
    }
}
