<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'clinic.guard' => \Modules\Clinic\Http\Middleware\SetClinicGuardAsDefault::class,
            'clinic.admin' => \Modules\Clinic\Http\Middleware\EnsureClinicAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });

        // A API nunca devolve mensagem interna (SQL, classe, stack), nem com APP_DEBUG
        // ligado: a exceção vai para o log e o front recebe só uma mensagem genérica.
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if (!$request->expectsJson() && !$request->is('api/*')) {
                return null;
            }

            if ($e instanceof \Illuminate\Validation\ValidationException
                || $e instanceof \Illuminate\Http\Exceptions\HttpResponseException) {
                return null;
            }

            $isHttp  = $e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
            $status  = $isHttp ? $e->getStatusCode() : 500;
            $headers = $isHttp ? $e->getHeaders() : [];

            if ($status < 500) {
                // 404 de model ou de enum no route binding trazem o nome da classe na mensagem.
                $previous = $e->getPrevious();
                $message  = $previous instanceof \Illuminate\Database\Eloquent\ModelNotFoundException
                    || $previous instanceof \Illuminate\Routing\Exceptions\BackedEnumCaseNotFoundException
                    ? 'Registro não encontrado.'
                    : $e->getMessage();

                if (empty($message)) {
                    $message = \Symfony\Component\HttpFoundation\Response::$statusTexts[$status] ?? 'Não foi possível concluir a requisição.';
                }

                return response()->json(['message' => $message], $status, $headers);
            }

            return response()->json(['message' => 'Ocorreu um erro inesperado. Tente novamente em instantes.'], $status, $headers);
        });
    })->create();
