<?php

namespace Modules\GoogleCalendar\Services;

use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;
use Modules\GoogleCalendar\Contracts\GoogleConnectionFlowServiceInterface;

class GoogleConnectionFlowService implements GoogleConnectionFlowServiceInterface
{
    private const STATE_TTL_SECONDS = 600;

    private const TICKET_TTL_SECONDS = 300;

    private const DEFAULT_RETURN_PATH = '/clinica/agenda';

    public function __construct(
        private readonly CacheRepository $cache,
        private readonly GoogleCalendarServiceInterface $google,
    ) {}

    public function authorizationUrl(int $clinicUserId, mixed $returnTo): string
    {
        $nonce = $this->randomToken();

        $this->cache->put($this->stateKey($nonce), [
            'uid'    => $clinicUserId,
            'return' => $this->resolveReturnPath($returnTo, $clinicUserId),
        ], self::STATE_TTL_SECONDS);

        return $this->google->getAuthUrl($nonce);
    }

    public function redirectAfterConsent(mixed $state, mixed $code, bool $deniedByGoogle): string
    {
        $flow = is_string($state) && !empty($state)
            ? $this->consume($this->stateKey($state), self::STATE_TTL_SECONDS)
            : null;

        if (is_null($flow)) {
            return self::DEFAULT_RETURN_PATH . '?google=error';
        }

        if ($deniedByGoogle || !is_string($code) || empty($code)) {
            return $flow['return'] . '?google=error';
        }

        $ticket = $this->randomToken();

        $this->cache->put($this->ticketKey($ticket), [
            'uid'  => $flow['uid'],
            'code' => Crypt::encryptString($code),
        ], self::TICKET_TTL_SECONDS);

        return $flow['return'] . '?google_ticket=' . $ticket;
    }

    public function complete(int $clinicUserId, string $ticket): void
    {
        $handshake = $this->consume($this->ticketKey($ticket), self::TICKET_TTL_SECONDS);

        if (is_null($handshake)) {
            throw ValidationException::withMessages([
                'ticket' => 'A conexão com o Google venceu ou já foi usada. Clique em conectar de novo.',
            ]);
        }

        if ($handshake['uid'] !== $clinicUserId) {
            abort(403, 'Esta conexão com o Google foi iniciada por outro usuário.');
        }

        try {
            $this->google->connectFromCallback($clinicUserId, Crypt::decryptString($handshake['code']));
        } catch (\Throwable $e) {
            Log::warning('Google Calendar: troca do code falhou', [
                'clinic_user_id' => $clinicUserId,
                'message'        => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'ticket' => 'O Google não confirmou a conexão. Clique em conectar de novo.',
            ]);
        }
    }

    /**
     * O marcador gravado com `add` (atômico) garante que duas requisições
     * simultâneas com o mesmo valor não consumam o mesmo registro. O `has`
     * antes dele evita gravar um marcador para cada valor inventado.
     *
     * @return array<string, mixed>|null
     */
    private function consume(string $key, int $ttlSeconds): ?array
    {
        if (!$this->cache->has($key) || !$this->cache->add($key . ':consumed', true, $ttlSeconds)) {
            return null;
        }

        $payload = $this->cache->pull($key);

        return is_array($payload) ? $payload : null;
    }

    /**
     * Só volta para as telas que concluem a conexão com o ticket: a agenda e
     * o próprio perfil de quem iniciou.
     */
    private function resolveReturnPath(mixed $path, int $clinicUserId): string
    {
        if (!is_string($path)) {
            return self::DEFAULT_RETURN_PATH;
        }

        $candidate = rtrim((string) parse_url($path, PHP_URL_PATH), '/');
        $allowed   = [self::DEFAULT_RETURN_PATH, "/clinica/usuarios/{$clinicUserId}/editar"];

        return in_array($candidate, $allowed, true) ? $candidate : self::DEFAULT_RETURN_PATH;
    }

    private function randomToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    private function stateKey(string $nonce): string
    {
        return 'googlecalendar:oauth:state:' . hash('sha256', $nonce);
    }

    private function ticketKey(string $ticket): string
    {
        return 'googlecalendar:oauth:ticket:' . hash('sha256', $ticket);
    }
}
