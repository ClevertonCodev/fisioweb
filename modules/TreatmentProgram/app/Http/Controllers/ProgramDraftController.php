<?php

namespace Modules\TreatmentProgram\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\TreatmentProgram\Contracts\ProgramDraftServiceInterface;

class ProgramDraftController extends ClinicAuthenticatedController
{
    public function __construct(
        protected ProgramDraftServiceInterface $programDraftService,
    ) {}

    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->programDraftService->showForUser($this->clinicUserId())]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'step'          => ['required', 'integer', 'in:1,2,3,4'],
            'selectedIds'   => ['required', 'array'],
            'selectedIds.*' => ['string'],
            'groups'        => ['required', 'array'],
            'savedAt'       => ['required', 'integer'],
        ]);

        $this->programDraftService->upsertForUser($this->clinicId(), $this->clinicUserId(), $data);

        return response()->json(['message' => 'Rascunho salvo.']);
    }

    public function destroy(): JsonResponse
    {
        $this->programDraftService->destroyForUser($this->clinicUserId());

        return response()->json(['message' => 'Rascunho descartado.']);
    }
}
