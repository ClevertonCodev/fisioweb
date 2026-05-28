<?php

namespace Modules\Clinic\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Models\ClinicProgramDraft;

class ProgramDraftController extends Controller
{
    public function show(): JsonResponse
    {
        $user  = Auth::guard('clinic')->user();
        $draft = ClinicProgramDraft::where('clinic_user_id', $user->id)->first();

        return response()->json(['data' => $draft?->draft_data]);
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

        ClinicProgramDraft::updateOrCreate(
            ['clinic_user_id' => $user->id],
            ['clinic_id' => $user->clinic_id, 'draft_data' => $data],
        );

        return response()->json(['message' => 'Rascunho salvo.']);
    }

    public function destroy(): JsonResponse
    {
        $user = Auth::guard('clinic')->user();
        ClinicProgramDraft::where('clinic_user_id', $user->id)->delete();

        return response()->json(['message' => 'Rascunho descartado.']);
    }
}
