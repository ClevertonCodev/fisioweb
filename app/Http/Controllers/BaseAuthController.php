<?php

namespace App\Http\Controllers;

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

    protected function attemptLogin(array $credentials): JsonResponse
    {
        $token = auth($this->guardName())->attempt($credentials);

        if (!$token) {
            return response()->json([
                'message' => 'Credenciais inválidas.',
            ], 401);
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
