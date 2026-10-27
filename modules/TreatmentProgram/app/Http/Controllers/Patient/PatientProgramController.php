<?php

namespace Modules\TreatmentProgram\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Http\Requests\Patient\SavePatientProgramSeriesRequest;
use Modules\TreatmentProgram\Http\Requests\Patient\SubmitPatientProgramFeedbackRequest;
use Modules\TreatmentProgram\Http\Requests\Patient\UpdateUnfinishedExercisesRequest;
use Modules\TreatmentProgram\Services\PatientProgram\CompletePatientProgramService;
use Modules\TreatmentProgram\Services\PatientProgram\GetPatientProgramDetailService;
use Modules\TreatmentProgram\Services\PatientProgram\ListPatientProgramsService;
use Modules\TreatmentProgram\Services\PatientProgram\RegisterPatientProgramViewService;
use Modules\TreatmentProgram\Services\PatientProgram\SavePatientProgramSeriesService;
use Modules\TreatmentProgram\Services\PatientProgram\StartOrResumePatientProgramExecutionService;
use Modules\TreatmentProgram\Services\PatientProgram\SubmitPatientProgramFeedbackService;
use Modules\TreatmentProgram\Services\PatientProgram\UpdateUnfinishedExercisesService;

class PatientProgramController extends Controller
{
    public function __construct(
        protected ListPatientProgramsService $listService,
        protected GetPatientProgramDetailService $detailService,
        protected RegisterPatientProgramViewService $viewService,
        protected StartOrResumePatientProgramExecutionService $startExecutionService,
        protected SavePatientProgramSeriesService $saveSeriesService,
        protected UpdateUnfinishedExercisesService $updateUnfinishedService,
        protected SubmitPatientProgramFeedbackService $feedbackService,
        protected CompletePatientProgramService $completeService,
    ) {}

    public function index(): JsonResponse
    {
        /** @var Patient $patient */
        $patient = Auth::guard('patient')->user();
        $data    = $this->listService->execute($patient);

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
