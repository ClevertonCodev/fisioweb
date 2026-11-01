<?php

namespace Modules\ClinicFinance\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Http\JsonResponse;
use Modules\ClinicFinance\Contracts\TransactionPeopleServiceInterface;
use Modules\ClinicFinance\Http\Requests\SearchFinancePatientsRequest;
use Modules\ClinicFinance\Models\FinancialTransaction;

/** Seletores de paciente e de atendimento do lançamento de entrada (administrador e secretária). */
class FinancialPatientController extends ClinicAuthenticatedController
{
    public function __construct(
        protected TransactionPeopleServiceInterface $people,
    ) {}

    public function index(SearchFinancePatientsRequest $request): JsonResponse
    {
        $this->authorize('create', FinancialTransaction::class);

        return response()->json(['data' => $this->people->searchPatients($this->clinicId(), $request->term())]);
    }

    public function appointments(int $patientId): JsonResponse
    {
        $this->authorize('create', FinancialTransaction::class);

        $appointments = $this->people->appointmentsOf($this->clinicId(), $patientId);
        abort_if(is_null($appointments), 404);

        return response()->json(['data' => $appointments]);
    }
}
