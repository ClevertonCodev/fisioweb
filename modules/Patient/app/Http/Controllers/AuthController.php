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
    /**
     * O limite do login é aplicado aqui, e não pelo middleware `throttle`,
     * porque o sucesso precisa zerar a contagem (FR-024). O middleware guarda
     * a contagem sob `md5($limiterName . $key)` — um detalhe interno do
     * framework que não dá para limpar de fora sem reproduzi-lo. Mantendo a
     * chave sob nosso controle, o reset é direto e a mensagem de 429 fica em
     * português. `find-clinics` segue no middleware: lá não há o que zerar.
     */
    private const LOGIN_MAX_ATTEMPTS = 5;

    private const LOGIN_DECAY_SECONDS = 60;

    public function __construct(
        protected PatientAuthService $authService,
    ) {}

    protected function guardName(): string
    {
        return 'patient';
    }

    /**
     * Passo 1 (apenas quando a clínica não vem do contexto da URL) — recebe o
     * identificador e devolve as clínicas em que o paciente tem cadastro.
     *
     * Identificador sem vínculo devolve lista vazia, nunca 404: sinalizar a
     * inexistência transformaria o endpoint em um oráculo de CPFs válidos, e
     * como a senha padrão deriva do CPF, esse sinal é meio caminho para o
     * comprometimento.
     */
    public function findClinics(FindClinicsRequest $request): JsonResponse
    {
        $identifier = PatientIdentifier::fromInput($request->string('identifier')->toString());

        return response()->json([
            'data' => $this->authService->findClinicsFor($identifier),
        ]);
    }

    /**
     * Passo 2 — autentica com identificador (CPF ou e-mail) + senha + clínica.
     *
     * A senha padrão atribuída na criação do cadastro é o CPF (ou o e-mail,
     * para quem não tem CPF), mas quem decide é o hash armazenado: a senha
     * informada é verificada de verdade.
     */
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

    /**
     * Tenta a senha exatamente como digitada e, só se falhar, a versão sem
     * pontuação.
     *
     * Motivo: a senha padrão é o CPF, que o sistema exibe mascarado em todas as
     * telas (`049.600.008-89`), mas grava com dígitos apenas (`04960000889`).
     * Sem essa tolerância, o paciente que digita o CPF como o vê na tela é
     * recusado — e não existe recuperação de senha no v1 para socorrê-lo.
     *
     * A tentativa exata vem primeiro e sempre vence, então uma senha
     * personalizada que contenha pontuação continua funcionando normalmente. A
     * segunda tentativa também passa pelo Hash::check: ela só tem sucesso se a
     * senha armazenada for de fato a forma numérica.
     */
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

    /**
     * Resposta única para identificador inexistente, senha incorreta, paciente
     * inelegível e clínica inválida — as quatro causas precisam ser
     * indistinguíveis na superfície.
     */
    private function invalidCredentials(): JsonResponse
    {
        return response()->json([
            'message' => 'Credenciais inválidas.',
        ], 401);
    }

    /**
     * Mesmo formato usado pelo limiter `patient-login` registrado no
     * PatientServiceProvider — precisa bater para que o sucesso zere a
     * contagem daquele identificador.
     */
    private function loginThrottleKey(LoginRequest $request, PatientIdentifier $identifier): string
    {
        return $identifier->throttleKey() . '|' . $request->ip();
    }

    /** Expõe o slug da clínica para o SPA montar rotas canônicas após restore. */
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
