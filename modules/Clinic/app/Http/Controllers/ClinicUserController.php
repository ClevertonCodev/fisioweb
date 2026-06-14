<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Contracts\ClinicUserServiceInterface;
use Modules\Clinic\Http\Requests\StoreClinicUserRequest;
use Modules\Clinic\Http\Requests\UpdateClinicUserRequest;
use Modules\Clinic\Models\ClinicUser;
use Modules\Cloudflare\Contracts\FileServiceInterface;

class ClinicUserController extends Controller
{
    public function __construct(
        protected ClinicUserServiceInterface $clinicUserService,
        protected FileServiceInterface $fileService,
    ) {
        $this->authorizeResource(ClinicUser::class, 'user');
    }

    public function professionals(): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        $users    = ClinicUser::query()
            ->where('clinic_id', $clinicId)
            ->where('status', ClinicUser::STATUS_ACTIVE)
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json(['data' => $users]);
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

    public function uploadPhoto(Request $request, ClinicUser $user): JsonResponse
    {
        $this->authorize('update', $user);

        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        if ((int) $user->clinic_id !== (int) $clinicId) {
            return response()->json(['message' => 'Usuário não encontrado.'], 404);
        }

        $request->validate([
            'photo' => ['required', 'file', 'image', 'mimes:jpeg,png,webp', 'max:2048'],
        ]);

        $uploaded = $this->fileService->uploadFile($request->file('photo'), 'clinic-users/photos');
        $user     = $this->clinicUserService->update($user, ['photo_url' => $uploaded['cdn_url']]);

        return response()->json(['data' => $user]);
    }

    public function deletePhoto(ClinicUser $user): JsonResponse
    {
        $this->authorize('update', $user);

        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        if ((int) $user->clinic_id !== (int) $clinicId) {
            return response()->json(['message' => 'Usuário não encontrado.'], 404);
        }

        $user = $this->clinicUserService->update($user, ['photo_url' => null]);

        return response()->json(['data' => $user]);
    }

    public function destroy(ClinicUser $user): JsonResponse
    {
        $this->clinicUserService->delete($user);

        return response()->json(['message' => 'Usuário removido com sucesso.']);
    }
}
