<?php

namespace Modules\Clinic\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Clinic\Contracts\ClinicRegistrationServiceInterface;
use Modules\Clinic\Data\RegisterClinicData;
use Modules\Clinic\Http\Requests\RegisterClinicRequest;
use Modules\Clinic\Http\Requests\ResendClinicVerificationRequest;
use Modules\Clinic\Http\Requests\VerifyClinicEmailRequest;

class ClinicRegistrationController extends Controller
{
    public function __construct(
        protected ClinicRegistrationServiceInterface $registrationService,
    ) {}

    public function slugAvailability(Request $request): JsonResponse
    {
        $rawSlug = $request->query('slug');
        $slug    = is_string($rawSlug) ? $rawSlug : null;

        return response()->json([
            'data' => $this->registrationService->checkSlugAvailability($slug),
        ]);
    }

    public function register(RegisterClinicRequest $request): JsonResponse
    {
        $dto    = RegisterClinicData::fromValidated($request->validated());
        $result = $this->registrationService->register($dto);

        return response()->json([
            'data' => [
                'clinic_id' => (int) $result['clinic']->id,
                'email'     => $result['master']->email,
            ],
            'message' => 'Conta criada com sucesso. Confirme seu e-mail para entrar.',
        ], 201);
    }

    public function verifyEmail(VerifyClinicEmailRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $verified = $this->registrationService->verifyEmail(
            userId: (int) $validated['id'],
            hash: (string) $validated['hash'],
            expires: (int) $validated['expires'],
            signature: (string) $validated['signature'],
        );

        if (!$verified) {
            return response()->json([
                'message' => 'Link de confirmação inválido ou expirado. Peça um novo link.',
            ], 422);
        }

        return response()->json([
            'message' => 'E-mail confirmado com sucesso.',
        ]);
    }

    public function resendVerification(ResendClinicVerificationRequest $request): JsonResponse
    {
        $this->registrationService->resendVerification((string) $request->validated('email'));

        return response()->json([
            'message' => 'Se houver um cadastro pendente com este e-mail, enviamos um novo link de confirmação.',
        ]);
    }
}
