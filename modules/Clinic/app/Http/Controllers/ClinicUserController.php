<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Clinic\Contracts\ClinicUserServiceInterface;
use Modules\Clinic\Http\Requests\StoreClinicUserRequest;
use Modules\Clinic\Http\Requests\UpdateClinicUserRequest;
use Modules\Clinic\Models\ClinicUser;
use Modules\Cloudflare\Contracts\FileServiceInterface;

class ClinicUserController extends ClinicAuthenticatedController
{
    public function __construct(
        protected ClinicUserServiceInterface $clinicUserService,
        protected FileServiceInterface $fileService,
    ) {
        // Antes do authorizeResource: o Gate::before libera o admin de qualquer
        // clínica, e o FormRequest validaria o payload antes do controller.
        $this->middleware(function (Request $request, Closure $next) {
            $user = $request->route('user');

            if ($user instanceof ClinicUser && (int) $user->clinic_id !== $this->clinicId()) {
                return response()->json(['message' => 'Usuário não encontrado.'], 404);
            }

            return $next($request);
        });

        $this->authorizeResource(ClinicUser::class, 'user');
    }

    public function professionals(): JsonResponse
    {
        $authUser = $this->clinicUser();

        $query = ClinicUser::query()
            ->where('clinic_id', $this->clinicId())
            ->where('status', ClinicUser::STATUS_ACTIVE)
            ->whereIn('role', ClinicUser::ATTENDABLE_ROLES);

        // Fisioterapeuta só enxerga (e marca para) ele mesmo (FR-012).
        if ($authUser->isPhysiotherapist()) {
            $query->where('id', $authUser->id);
        }

        $users = $query->orderBy('name')->get(['id', 'name', 'photo_url']);

        return response()->json(['data' => $users]);
    }

    public function index(): JsonResponse
    {
        $users = $this->clinicUserService->listForClinic($this->clinicId());

        return response()->json(['data' => $users]);
    }

    public function show(ClinicUser $user): JsonResponse
    {
        return response()->json(['data' => $user]);
    }

    public function store(StoreClinicUserRequest $request): JsonResponse
    {
        $user = $this->clinicUserService->create($request->validated(), $this->clinicId());

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

        $user = $this->clinicUserService->update($user, ['photo_url' => null]);

        return response()->json(['data' => $user]);
    }

    public function destroy(ClinicUser $user): JsonResponse
    {
        $this->clinicUserService->delete($user);

        return response()->json(['message' => 'Usuário removido com sucesso.']);
    }
}
