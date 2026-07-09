<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\Admin\Contracts\Public\ExerciseSubmissionServiceInterface;
use Modules\Admin\Http\Requests\ReviewExerciseRequest;

class ExerciseReviewController extends Controller
{
    public function __construct(
        protected ExerciseSubmissionServiceInterface $submissionService,
    ) {}

    public function pendingCount(): JsonResponse
    {
        return response()->json(['data' => ['pending_count' => $this->submissionService->pendingCount()]]);
    }

    public function approve(int $id): JsonResponse
    {
        try {
            $exercise = $this->submissionService->approve($id, (int) Auth::guard('admin')->id());

            return response()->json(['data' => $exercise]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Exercício não encontrado.'], 404);
        }
    }

    public function reject(ReviewExerciseRequest $request, int $id): JsonResponse
    {
        try {
            $exercise = $this->submissionService->reject(
                $id,
                (int) Auth::guard('admin')->id(),
                $request->validated('reason'),
            );

            return response()->json(['data' => $exercise]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Exercício não encontrado.'], 404);
        }
    }
}
