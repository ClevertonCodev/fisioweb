<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\BaseAuthController;
use Illuminate\Http\JsonResponse;
use Modules\Clinic\Http\Requests\LoginRequest;

class AuthController extends BaseAuthController
{
    protected function guardName(): string
    {
        return 'clinic';
    }

    public function login(LoginRequest $request): JsonResponse
    {
        return $this->attemptLogin($request->validated());
    }
}
