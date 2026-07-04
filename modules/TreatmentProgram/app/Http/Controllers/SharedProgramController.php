<?php

namespace Modules\TreatmentProgram\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Admin\Contracts\Public\ProgramCatalogReadServiceInterface;

class SharedProgramController extends Controller
{
    public function __construct(
        protected ProgramCatalogReadServiceInterface $programCatalog,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $programs = $this->programCatalog->paginate(
            $request->only(['search', 'physio_area_id']),
            $request->integer('per_page', 15),
        );

        return response()->json($programs);
    }

    public function show(int $id): JsonResponse
    {
        $program = $this->programCatalog->findActiveWithDetails($id);

        return response()->json(['data' => $program]);
    }
}
