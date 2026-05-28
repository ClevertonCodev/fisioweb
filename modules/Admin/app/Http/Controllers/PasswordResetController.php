<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\BasePasswordResetController;
use Illuminate\Http\JsonResponse;
use Modules\Admin\Http\Requests\ForgotPasswordRequest;
use Modules\Admin\Http\Requests\ResetPasswordRequest;

class PasswordResetController extends BasePasswordResetController
{
    protected function brokerName(): string
    {
        return 'users';
    }

    protected function resetFrontendPath(): string
    {
        return 'admin/redefinir-senha';
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
