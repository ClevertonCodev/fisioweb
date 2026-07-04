<?php

namespace Modules\TreatmentProgram\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\TreatmentProgram\Contracts\ProgramDraftServiceInterface;

class ProgramDraftController extends Controller
{
    public function __construct(
        protected ProgramDraftServiceInterface $programDraftService,
    ) {}

    public function show(): JsonResponse
    {
        $user = Auth::guard('clinic')->user();

        return response()->json(['data' => $this->programDraftService->showForUser($user->id)]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $user = Auth::guard('clinic')->user();

        $data = $request->validate([
            'step'          => ['required', 'integer', 'in:1,2,3,4'],
            'selectedIds'   => ['required', 'array'],
            'selectedIds.*' => ['string'],
            'groups'        => ['required', 'array'],
            'savedAt'       => ['required', 'integer'],
        ]);

        $this->programDraftService->upsertForUser($user->clinic_id, $user->id, $data);

        return response()->json(['message' => 'Rascunho salvo.']);
    }

    public function destroy(): JsonResponse
    {
        $user = Auth::guard('clinic')->user();
        $this->programDraftService->destroyForUser($user->id);

        return response()->json(['message' => 'Rascunho descartado.']);
    }
}
