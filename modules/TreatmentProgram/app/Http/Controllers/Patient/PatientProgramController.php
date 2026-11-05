<?php

namespace Modules\TreatmentProgram\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Modules\TreatmentProgram\Contracts\CompletePatientProgramServiceInterface;
use Modules\TreatmentProgram\Contracts\GetPatientProgramDetailServiceInterface;
use Modules\TreatmentProgram\Contracts\ListPatientProgramsServiceInterface;
use Modules\TreatmentProgram\Contracts\RegisterPatientProgramViewServiceInterface;
use Modules\TreatmentProgram\Contracts\SavePatientProgramSeriesServiceInterface;
use Modules\TreatmentProgram\Contracts\StartOrResumePatientProgramExecutionServiceInterface;
use Modules\TreatmentProgram\Contracts\SubmitPatientProgramFeedbackServiceInterface;
use Modules\TreatmentProgram\Contracts\UpdateUnfinishedExercisesServiceInterface;
use Modules\TreatmentProgram\Http\Requests\Patient\SavePatientProgramSeriesRequest;
use Modules\TreatmentProgram\Http\Requests\Patient\SubmitPatientProgramFeedbackRequest;
use Modules\TreatmentProgram\Http\Requests\Patient\UpdateUnfinishedExercisesRequest;

class PatientProgramController extends Controller
{
    public function __construct(
        protected ListPatientProgramsServiceInterface $listService,
        protected GetPatientProgramDetailServiceInterface $detailService,
        protected RegisterPatientProgramViewServiceInterface $viewService,
        protected StartOrResumePatientProgramExecutionServiceInterface $startExecutionService,
        protected SavePatientProgramSeriesServiceInterface $saveSeriesService,
        protected UpdateUnfinishedExercisesServiceInterface $updateUnfinishedService,
        protected SubmitPatientProgramFeedbackServiceInterface $feedbackService,
        protected CompletePatientProgramServiceInterface $completeService,
    ) {}

    public function index(): JsonResponse
    {
        $user = Auth::guard('patient')->user();

        if (is_null($user)) {
            abort(401);
        }

        $data = $this->listService->execute(
            (int) $user->getAuthIdentifier(),
            (int) $user->getAttribute('clinic_id'),
        );

        return response()->json(['data' => $data]);
    }

    public function show(string $publicToken): JsonResponse
    {
        try {
            $data = $this->detailService->execute($publicToken);

            return response()->json(['data' => $data]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Programa não encontrado.'], 404);
        }
    }

    public function view(string $publicToken): JsonResponse
    {
        try {
            $data = $this->viewService->execute($publicToken);

            return response()->json(['data' => $data]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Programa não encontrado.'], 404);
        }
    }

    public function startExecution(string $publicToken): JsonResponse
    {
        try {
            $data = $this->startExecutionService->execute($publicToken);

            return response()->json(['data' => $data]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Programa não encontrado.'], 404);
        }
    }

    public function saveSeries(
        string $publicToken,
        int $executionId,
        SavePatientProgramSeriesRequest $request,
    ): JsonResponse {
        try {
            $data = $this->saveSeriesService->execute(
                $publicToken,
                $executionId,
                $request->toDto(),
            );

            return response()->json(['data' => $data]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Recurso não encontrado.'], 404);
        }
    }

    public function updateUnfinished(
        string $publicToken,
        int $executionId,
        UpdateUnfinishedExercisesRequest $request,
    ): JsonResponse {
        try {
            $data = $this->updateUnfinishedService->execute(
                $publicToken,
                $executionId,
                $request->toDto(),
            );

            return response()->json(['data' => $data]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Recurso não encontrado.'], 404);
        }
    }

    public function feedback(string $publicToken, SubmitPatientProgramFeedbackRequest $request): JsonResponse
    {
        try {
            $data = $this->feedbackService->execute($publicToken, $request->toDto());

            return response()->json(['data' => $data]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Recurso não encontrado.'], 404);
        }
    }

    public function complete(string $publicToken): JsonResponse
    {
        try {
            $data = $this->completeService->execute($publicToken);

            return response()->json(['data' => $data]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Programa não encontrado.'], 404);
        }
    }
}
