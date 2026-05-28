<?php

namespace Modules\Patient\Http\Controllers;

use App\Http\Controllers\BaseAuthController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Patient\Http\Requests\LoginRequest;
use Modules\Patient\Models\Patient;

class AuthController extends BaseAuthController
{
    protected function guardName(): string
    {
        return 'patient';
    }

    /**
     * Passo 1 — recebe o CPF e retorna as clínicas onde o paciente está cadastrado.
     * O frontend exibe a lista para o usuário escolher antes de logar.
     */
    public function findClinics(Request $request): JsonResponse
    {
        $request->validate(['cpf' => ['required', 'string']]);

        $cpf = preg_replace('/\D/', '', $request->cpf);

        $clinics = Patient::where('cpf', $cpf)
            ->with('clinic:id,name')
            ->get()
            ->map(fn (Patient $p) => [
                'id'   => $p->clinic->id,
                'name' => $p->clinic->name,
            ]);

        if ($clinics->isEmpty()) {
            return response()->json(['message' => 'CPF não encontrado.'], 404);
        }

        return response()->json(['data' => $clinics]);
    }

    /**
     * Passo 2 — autentica com CPF + clinic_id.
     * A senha padrão é o próprio CPF (definida automaticamente na criação).
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $cpf = preg_replace('/\D/', '', $request->cpf);

        return $this->attemptLogin([
            'cpf'       => $cpf,
            'clinic_id' => $request->clinic_id,
            'password'  => $cpf,
        ]);
    }
}
