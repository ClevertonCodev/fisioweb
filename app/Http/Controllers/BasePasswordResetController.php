<?php

namespace App\Http\Controllers;

use App\Notifications\QueuedResetPassword;
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
        Password::broker($this->brokerName())->sendResetLink(
            $request->only('email'),
            function ($user, string $token): void {
                $user->notify(new QueuedResetPassword($token, $this->resetUrl($user, $token)));
            }
        );

        // A resposta é a mesma com ou sem conta, e também quando o broker
        // segura um novo pedido (isso só acontece com quem tem conta): assim
        // a rota não revela quem tem acesso.
        return response()->json([
            'message' => 'Se houver uma conta com este e-mail, enviamos um link para criar uma senha nova.',
        ]);
    }

    private function resetUrl(object $user, string $token): string
    {
        return rtrim((string) config('app.url'), '/')
            . '/' . $this->resetFrontendPath()
            . '?token=' . $token
            . '&email=' . urlencode($user->getEmailForPasswordReset());
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

        // Token errado e e-mail sem conta respondem igual (o broker só diz
        // "token inválido" quando a conta existe): a rota não revela quem
        // tem acesso.
        return response()->json(['message' => 'Link inválido ou expirado. Peça um novo link.'], 422);
    }
}
