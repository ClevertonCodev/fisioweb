<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Contracts\EvolutionServiceInterface;
use Modules\Clinic\Http\Requests\StoreEvolutionRequest;
use Modules\Clinic\Http\Requests\UpdateEvolutionRequest;
use Modules\Clinic\Models\PatientEvolution;
use Modules\Patient\Contracts\PatientServiceInterface;
use Modules\Pdf\Services\PdfService;

class EvolutionController extends Controller
{
    public function __construct(
        protected EvolutionServiceInterface $evolutionService,
        protected PatientServiceInterface $patientService,
        protected PdfService $pdfService,
    ) {}

    public function indexByPatient(int $patient): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        $found    = $this->patientService->find($patient);

        if (!$found || (int) $found->clinic_id !== (int) $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $data = $this->evolutionService->listByPatient((int) $clinicId, $patient);

        return response()->json(['data' => $data]);
    }

    public function storeForPatient(StoreEvolutionRequest $request, int $patient): JsonResponse
    {
        $this->authorize('create', PatientEvolution::class);

        $clinicUser = Auth::guard('clinic')->user();
        $clinicId   = $clinicUser->clinic_id;
        $found      = $this->patientService->find($patient);

        if (!$found || (int) $found->clinic_id !== (int) $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $evolution = $this->evolutionService->create(
            $request->validated(),
            (int) $clinicId,
            $patient,
            (int) $clinicUser->id,
        );

        return response()->json(['data' => $evolution], 201);
    }

    public function show(int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        try {
            $evolution = $this->evolutionService->findForClinic($id, (int) $clinicId);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Evolução não encontrada.'], 404);
        }

        return response()->json(['data' => $evolution]);
    }

    public function update(UpdateEvolutionRequest $request, int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        try {
            $evolution = $this->evolutionService->findForClinic($id, (int) $clinicId);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Evolução não encontrada.'], 404);
        }

        $this->authorize('update', $evolution);

        $evolution = $this->evolutionService->update($evolution, $request->validated());

        return response()->json(['data' => $evolution]);
    }

    public function generateText(Request $request, int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        try {
            $evolution = $this->evolutionService->findForClinic($id, (int) $clinicId);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Evolução não encontrada.'], 404);
        }

        $this->authorize('generateText', $evolution);

        $checkedItemIds = $request->input('checked_item_ids', []);
        $freeTextValues = $request->input('free_text_values', []);

        $text = $this->evolutionService->generateText($checkedItemIds, $freeTextValues);

        return response()->json(['data' => ['generated_text' => $text]]);
    }

    public function sign(int $id): JsonResponse
    {
        $clinicUser = Auth::guard('clinic')->user();
        $clinicId   = $clinicUser->clinic_id;

        try {
            $evolution = $this->evolutionService->findForClinic($id, (int) $clinicId);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Evolução não encontrada.'], 404);
        }

        $this->authorize('sign', $evolution);

        $evolution = $this->evolutionService->sign($evolution, (int) $clinicUser->id);

        return response()->json(['data' => $evolution]);
    }

    public function downloadPdf(int $id)
    {
        $clinicId  = Auth::guard('clinic')->user()->clinic_id;

        try {
            $evolution = $this->evolutionService->findForClinic($id, (int) $clinicId);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Evolução não encontrada.'], 404);
        }

        $evolution->load(['patient', 'clinic', 'clinicUser', 'template']);

        $filename = \Str::slug($evolution->title) . '-evolucao.pdf';

        return $this->pdfService->download('pdf.clinic.evolution.evolution', compact('evolution'), $filename);
    }

    public function destroy(int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        try {
            $evolution = $this->evolutionService->findForClinic($id, (int) $clinicId);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Evolução não encontrada.'], 404);
        }

        $this->authorize('delete', $evolution);

        $this->evolutionService->destroy($evolution);

        return response()->json(['message' => 'Evolução removida com sucesso.']);
    }
}
