<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

abstract class BaseAuthController extends Controller
{
    abstract protected function guardName(): string;

    protected function respondWithToken(string $token): JsonResponse
    {
        $guard = auth($this->guardName());

        return response()->json([
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => $guard->factory()->getTTL() * 60,
            'user'         => $guard->user(),
        ]);
    }

    /**
     * Se o usuário com a senha certa pode entrar (ex.: está ativo). Só é
     * consultado depois da senha conferida, então não revela quem tem conta.
     */
    protected function canLogIn(Authenticatable $user): bool
    {
        return true;
    }

    protected function blockedLoginMessage(): string
    {
        return 'Seu acesso está desativado.';
    }

    protected function attemptLogin(array $credentials): JsonResponse
    {
        $guard = auth($this->guardName());
        $token = $guard->attempt($credentials);

        if (!$token) {
            return response()->json([
                'message' => 'Credenciais inválidas.',
            ], 401);
        }

        if (!$this->canLogIn($guard->user())) {
            // O token acabou de ser emitido: invalida antes de responder.
            $guard->logout();

            return response()->json([
                'message' => $this->blockedLoginMessage(),
            ], 403);
        }

        return $this->respondWithToken($token);
    }

    public function me(): JsonResponse
    {
        return response()->json(auth($this->guardName())->user());
    }

    public function logout(): JsonResponse
    {
        auth($this->guardName())->logout();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }

    public function refresh(): JsonResponse
    {
        $token = auth($this->guardName())->refresh();

        return $this->respondWithToken($token);
    }
}
