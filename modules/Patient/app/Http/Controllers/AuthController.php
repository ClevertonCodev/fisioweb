<?php

namespace Modules\Patient\Http\Controllers;

use App\Http\Controllers\BaseAuthController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\RateLimiter;
use Modules\Patient\Http\Requests\FindClinicsRequest;
use Modules\Patient\Http\Requests\LoginRequest;
use Modules\Patient\Models\Patient;
use Modules\Patient\Services\PatientAuthService;
use Modules\Patient\Support\PatientIdentifier;

class AuthController extends BaseAuthController
{
    private const LOGIN_MAX_ATTEMPTS = 5;

    private const LOGIN_DECAY_SECONDS = 60;

    public function __construct(
        protected PatientAuthService $authService,
    ) {}

    protected function guardName(): string
    {
        return 'patient';
    }

    public function findClinics(FindClinicsRequest $request): JsonResponse
    {
        $identifier = PatientIdentifier::fromInput($request->string('identifier')->toString());

        return response()->json([
            'data' => $this->authService->findClinicsFor($identifier),
        ]);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $identifier  = PatientIdentifier::fromInput($request->string('identifier')->toString());
        $throttleKey = $this->loginThrottleKey($request, $identifier);

        if (RateLimiter::tooManyAttempts($throttleKey, self::LOGIN_MAX_ATTEMPTS)) {
            return response()->json([
                'message' => 'Muitas tentativas. Aguarde ' . RateLimiter::availableIn($throttleKey) . ' segundos e tente novamente.',
            ], 429);
        }

        RateLimiter::hit($throttleKey, self::LOGIN_DECAY_SECONDS);

        $clinicId = $this->authService->resolveClinicId(
            $request->filled('clinic_id') ? $request->integer('clinic_id') : null,
            $request->string('clinic_slug')->toString() ?: null,
        );

        if (is_null($clinicId)) {
            return $this->invalidCredentials();
        }

        $token = $this->attemptWithPassword(
            $identifier,
            $clinicId,
            $request->string('password')->toString(),
        );

        if (!$token) {
            return $this->invalidCredentials();
        }

        /** @var Patient $patient */
        $patient = auth($this->guardName())->user();

        if (!$this->authService->isEligible($patient)) {
            auth($this->guardName())->logout();

            return $this->invalidCredentials();
        }

        RateLimiter::clear($throttleKey);

        return $this->respondWithToken($token);
    }

    private function attemptWithPassword(
        PatientIdentifier $identifier,
        int $clinicId,
        string $password,
    ): string|false {
        $credentials = [
            $identifier->column() => $identifier->value,
            'clinic_id'           => $clinicId,
        ];

        $token = auth($this->guardName())->attempt($credentials + ['password' => $password]);

        if ($token) {
            return $token;
        }

        $digitsOnly = preg_replace('/\D/', '', $password);

        if ($digitsOnly === '' || $digitsOnly === $password) {
            return false;
        }

        return auth($this->guardName())->attempt($credentials + ['password' => $digitsOnly]);
    }

    private function invalidCredentials(): JsonResponse
    {
        return response()->json([
            'message' => 'Credenciais inválidas.',
        ], 401);
    }

    private function loginThrottleKey(LoginRequest $request, PatientIdentifier $identifier): string
    {
        return $identifier->throttleKey() . '|' . $request->ip();
    }

    public function me(): JsonResponse
    {
        /** @var Patient $patient */
        $patient = auth($this->guardName())->user();
        $patient->loadMissing('clinic:id,slug');

        $data                = $patient->toArray();
        $data['clinic_slug'] = $patient->clinic?->slug;

        return response()->json($data);
    }
}
