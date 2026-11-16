<?php

namespace Modules\GoogleCalendar\Contracts;

interface GoogleConnectionFlowServiceInterface
{
    public function authorizationUrl(int $clinicUserId, mixed $returnTo): string;

    /**
     * Destino do navegador na volta do consentimento: a tela de origem com
     * `?google_ticket=` ou com `?google=error`.
     */
    public function redirectAfterConsent(mixed $state, mixed $code, bool $deniedByGoogle): string;

    /**
     * @throws \Illuminate\Validation\ValidationException ticket vencido, já usado ou recusado pelo Google
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException 403 quando o ticket é de outro usuário
     */
    public function complete(int $clinicUserId, string $ticket): void;
}
