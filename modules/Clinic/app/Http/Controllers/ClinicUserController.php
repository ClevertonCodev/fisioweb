<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Contracts\ClinicUserServiceInterface;
use Modules\Clinic\Http\Requests\StoreClinicUserRequest;
use Modules\Clinic\Http\Requests\UpdateClinicUserRequest;
use Modules\Clinic\Models\ClinicUser;

class ClinicUserController extends Controller
{
    public function __construct(
        protected ClinicUserServiceInterface $clinicUserService,
    ) {
        $this->authorizeResource(ClinicUser::class, 'user');
    }

    public function index(): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        $users    = $this->clinicUserService->listForClinic((int) $clinicId);

        return response()->json(['data' => $users]);
    }

    public function show(ClinicUser $user): JsonResponse
    {
        return response()->json(['data' => $user]);
    }

    public function store(StoreClinicUserRequest $request): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        $user     = $this->clinicUserService->create($request->validated(), (int) $clinicId);

        return response()->json(['data' => $user], 201);
    }

    public function update(UpdateClinicUserRequest $request, ClinicUser $user): JsonResponse
    {
        $user = $this->clinicUserService->update($user, $request->validated());

        return response()->json(['data' => $user]);
    }

    public function destroy(ClinicUser $user): JsonResponse
    {
        $this->clinicUserService->delete($user);

        return response()->json(['message' => 'Usuário removido com sucesso.']);
    }
}
