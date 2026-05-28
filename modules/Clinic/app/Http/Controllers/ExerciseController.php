<?php

namespace Modules\Clinic\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\Admin\Contracts\ExerciseServiceInterface;
use Modules\Admin\Models\Exercise;
use Modules\Clinic\Models\ExerciseFavorite;

class ExerciseController extends Controller
{
    public function __construct(
        protected ExerciseServiceInterface $exerciseService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $clinicUserId = Auth::guard('clinic')->id();
        $filters      = $request->only([
            'search', 'physio_area_id', 'physio_subarea_id',
            'body_region_id', 'difficulty_level', 'movement_form', 'is_active',
        ]);
        $perPage      = $request->integer('per_page', 15);
        $result       = $this->exerciseService->list($filters, $perPage);
        $favoriteIds  = ExerciseFavorite::where('clinic_user_id', $clinicUserId)->pluck('exercise_id')->all();
        $result->getCollection()->transform(function ($item) use ($favoriteIds) {
            $item->is_favorite = in_array($item->id, $favoriteIds);

            return $item;
        });

        return response()->json(['data' => $result]);
    }

    public function toggleFavorite(int $id): JsonResponse
    {
        $clinicUserId = Auth::guard('clinic')->id();
        $exercise     = Exercise::find($id);

        if (!$exercise) {
            return response()->json(['message' => 'Exercício não encontrado.'], 404);
        }

        $deleted = ExerciseFavorite::where('clinic_user_id', $clinicUserId)
            ->where('exercise_id', $id)
            ->delete();

        if ($deleted > 0) {
            return response()->json(['data' => ['exercise_id' => $id, 'is_favorite' => false]]);
        }

        try {
            ExerciseFavorite::create(['clinic_user_id' => $clinicUserId, 'exercise_id' => $id]);
        } catch (\Illuminate\Database\UniqueConstraintViolationException) {
            return response()->json(['data' => ['exercise_id' => $id, 'is_favorite' => true]]);
        }

        return response()->json(['data' => ['exercise_id' => $id, 'is_favorite' => true]]);
    }

    public function favorites(Request $request): JsonResponse
    {
        $clinicUserId = Auth::guard('clinic')->id();
        $ids          = ExerciseFavorite::where('clinic_user_id', $clinicUserId)->pluck('exercise_id');
        $exercises    = Exercise::with(['physioArea', 'physioSubarea', 'bodyRegion', 'videos'])
            ->whereIn('id', $ids)
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        return response()->json(['data' => $exercises]);
    }
}
