<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\BaseAuthController;
use Illuminate\Http\JsonResponse;
use Modules\Admin\Http\Requests\LoginRequest;

class AuthController extends BaseAuthController
{
    protected function guardName(): string
    {
        return 'admin';
    }

    public function login(LoginRequest $request): JsonResponse
    {
        return $this->attemptLogin($request->validated());
    }
}
