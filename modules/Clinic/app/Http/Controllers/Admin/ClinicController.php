<?php

namespace Modules\Clinic\Http\Controllers\Admin;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Clinic\Contracts\ClinicImpersonationServiceInterface;
use Modules\Clinic\Contracts\ClinicServiceInterface;
use Modules\Clinic\Contracts\MasterFirstAccessServiceInterface;
use Modules\Clinic\Http\Requests\Admin\CreateClinicRequest;
use Modules\Clinic\Http\Requests\Admin\UpdateClinicRequest;
use Modules\Clinic\Models\ClinicUser;

class ClinicController extends Controller
{
    public function __construct(
        protected ClinicServiceInterface $clinicService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['is_active', 'search', 'plan_id', 'status', 'date_from', 'date_to']);
        $perPage = $request->integer('per_page', 15);

        return response()->json([
            'data' => $this->clinicService->list($filters, $perPage),
        ]);
    }

    public function show(
        int $id,
        MasterFirstAccessServiceInterface $firstAccess,
        ClinicImpersonationServiceInterface $impersonation,
    ): JsonResponse {
        try {
            $clinic = $this->clinicService->findById($id);

            return response()->json(['data' => $clinic->toArray()
                + $firstAccess->status($clinic)
                + ['recent_login_as' => $impersonation->recentLoginAs($clinic->id)]]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Fisioterapeuta não encontrado.'], 404);
        }
    }

    public function store(CreateClinicRequest $request): JsonResponse
    {
        $clinic = $this->clinicService->create($request->validated());

        return response()->json(['data' => $clinic], 201);
    }

    public function update(UpdateClinicRequest $request, int $id): JsonResponse
    {
        try {
            $clinic = $this->clinicService->update($id, $request->validated());

            return response()->json(['data' => $clinic]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Fisioterapeuta não encontrado.'], 404);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->clinicService->cancel($id);

            return response()->json(['message' => 'Clínica cancelada com sucesso.']);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Clínica não encontrada.'], 404);
        }
    }

    public function reactivate(int $id): JsonResponse
    {
        try {
            $clinic = $this->clinicService->reactivate($id);

            return response()->json(['data' => $clinic, 'message' => 'Clínica reativada com sucesso.']);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Clínica não encontrada.'], 404);
        }
    }

    public function firstAccessLink(int $id, MasterFirstAccessServiceInterface $firstAccess): JsonResponse
    {
        try {
            return response()->json(['data' => $firstAccess->generateLink($id)->toArray()]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Clínica não encontrada.'], 404);
        }
    }

    public function loginAs(Request $request, int $id, ClinicImpersonationServiceInterface $impersonation): JsonResponse
    {
        try {
            $session = $impersonation->impersonate(
                $id,
                (int) auth('admin')->id(),
                $request->ip(),
                $request->userAgent(),
                fn (ClinicUser $user, array $claims): string => auth('clinic')->claims($claims)->login($user),
            );

            return response()->json([
                'access_token' => $session->token,
                'token_type'   => 'bearer',
                'expires_in'   => auth('clinic')->factory()->getTTL() * 60,
                'user'         => $session->clinicUser,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Clínica não encontrada.'], 404);
        }
    }
}
