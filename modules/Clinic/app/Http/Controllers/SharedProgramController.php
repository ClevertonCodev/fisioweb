<?php

namespace Modules\Clinic\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Admin\Models\AdminProgram;

class SharedProgramController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AdminProgram::with(['physioArea'])
            ->withCount('exercises')
            ->where('is_active', true);

        if ($search = $request->get('search')) {
            $query->where('title', 'like', '%' . $search . '%');
        }

        if ($physioAreaId = $request->integer('physio_area_id', 0)) {
            $query->where('physio_area_id', $physioAreaId);
        }

        $programs = $query->latest()->paginate($request->integer('per_page', 15));

        return response()->json($programs);
    }

    public function show(int $id): JsonResponse
    {
        $program = AdminProgram::with([
            'physioArea',
            'createdBy',
            'groups.exercises.exercise.videos',
        ])
            ->withCount('exercises')
            ->where('is_active', true)
            ->findOrFail($id);

        return response()->json(['data' => $program]);
    }
}
