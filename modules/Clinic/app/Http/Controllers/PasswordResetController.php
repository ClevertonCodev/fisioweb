<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\BasePasswordResetController;
use Illuminate\Http\JsonResponse;
use Modules\Clinic\Http\Requests\ForgotPasswordRequest;
use Modules\Clinic\Http\Requests\ResetPasswordRequest;

class PasswordResetController extends BasePasswordResetController
{
    protected function brokerName(): string
    {
        return 'clinic_users';
    }

    protected function resetFrontendPath(): string
    {
        return 'clinica/redefinir-senha';
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        return $this->handleForgotPassword($request);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        return $this->handleResetPassword($request);
    }
}
