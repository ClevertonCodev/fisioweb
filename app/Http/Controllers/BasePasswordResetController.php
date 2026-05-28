<?php

namespace App\Http\Controllers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Password;

abstract class BasePasswordResetController extends Controller
{
    /**
     * Nome do broker de senha configurado em config/auth.php > passwords.
     */
    abstract protected function brokerName(): string;

    /**
     * Caminho da rota frontend para redefinição de senha (sem a barra inicial).
     * Ex: 'admin/redefinir-senha' ou 'clinica/redefinir-senha'
     */
    abstract protected function resetFrontendPath(): string;

    protected function handleForgotPassword(Request $request): JsonResponse
    {
        ResetPassword::createUrlUsing(function ($notifiable, string $token): string {
            return config('app.url')
                . '/' . $this->resetFrontendPath()
                . '?token=' . $token
                . '&email=' . urlencode($notifiable->getEmailForPasswordReset());
        });

        $status = Password::broker($this->brokerName())->sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'E-mail de recuperação enviado. Verifique sua caixa de entrada.']);
        }

        if ($status === Password::RESET_THROTTLED) {
            return response()->json(['message' => 'Aguarde antes de solicitar um novo e-mail de recuperação.'], 429);
        }

        return response()->json(['message' => 'Não foi possível enviar o e-mail de recuperação.'], 400);
    }

    protected function handleResetPassword(Request $request): JsonResponse
    {
        $status = Password::broker($this->brokerName())->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password): void {
                $user->forceFill(['password' => $password])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Senha redefinida com sucesso.']);
        }

        if ($status === Password::INVALID_TOKEN) {
            return response()->json(['message' => 'Token inválido ou expirado.'], 422);
        }

        return response()->json(['message' => 'Não foi possível redefinir a senha.'], 422);
    }
}
