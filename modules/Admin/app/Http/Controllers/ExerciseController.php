<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Admin\Contracts\ExerciseServiceInterface;
use Modules\Admin\Http\Requests\StoreExerciseRequest;
use Modules\Admin\Http\Requests\UpdateExerciseRequest;
use Modules\Admin\Models\BodyRegion;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Media\Contracts\VideoServiceInterface;

class ExerciseController extends Controller
{
    public function __construct(
        protected ExerciseServiceInterface $exerciseService,
        protected VideoServiceInterface $videoService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'search', 'physio_area_id', 'physio_subarea_id',
            'body_region_id', 'difficulty_level', 'movement_form', 'is_active',
        ]);
        $perPage   = $request->integer('per_page', 15);
        $exercises = $this->exerciseService->list($filters, $perPage);

        return response()->json(['data' => $exercises]);
    }

    public function show(int $id): JsonResponse
    {
        try {
            $exercise = $this->exerciseService->find($id);
            $exercise->load([
                'physioArea', 'physioSubarea', 'bodyRegion',
                'createdBy', 'videos',
            ]);

            return response()->json(['data' => $exercise]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Exercício não encontrado.'], 404);
        }
    }

    public function store(StoreExerciseRequest $request): JsonResponse
    {
        $exercise = $this->exerciseService->create($request->validated());
        $exercise->load(['physioArea', 'physioSubarea', 'bodyRegion', 'videos']);

        return response()->json(['data' => $exercise], 201);
    }

    public function update(UpdateExerciseRequest $request, int $id): JsonResponse
    {
        try {
            $exercise = $this->exerciseService->update($id, $request->validated());
            $exercise->load(['physioArea', 'physioSubarea', 'bodyRegion', 'videos']);

            return response()->json(['data' => $exercise]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Exercício não encontrado.'], 404);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->exerciseService->delete($id);

            return response()->json(['message' => 'Exercício removido com sucesso.']);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Exercício não encontrado.'], 404);
        }
    }

    public function options(): JsonResponse
    {
        $data = [
            'physio_areas'   => PhysioArea::with('subareas:id,physio_area_id,name')->orderBy('name')->get(['id', 'name']),
            'body_regions'   => BodyRegion::with('children:id,name,parent_id')->roots()->orderBy('name')->get(['id', 'name']),
            'difficulties'   => Exercise::DIFFICULTIES,
            'movement_forms' => Exercise::MOVEMENT_FORMS,
            'videos'         => $this->videoService->getAvailableForExercise(),
        ];

        return response()->json(['data' => $data]);
    }
}
