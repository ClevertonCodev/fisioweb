<?php

namespace Modules\WhatsApp\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Modules\WhatsApp\Contracts\WhatsAppServiceInterface;

class SendWhatsAppMessageJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public array $backoff = [10, 30, 60];

    public function __construct(
        public string $to,
        public string $body,
        public ?string $mediaUrl = null,
    ) {}

    public function handle(WhatsAppServiceInterface $whatsAppService): void
    {
        if (!$whatsAppService->isConfigured()) {
            logWarning('WhatsApp mensagem pulada porque o serviço não está configurado.', ['to' => $this->to]);

            return;
        }

        $result = $whatsAppService->send($this->to, $this->body, $this->mediaUrl);

        logInfo('WhatsApp mensagem enviada com sucesso.', [
            'to'     => $this->to,
            'sid'    => $result['sid'] ?? null,
            'status' => $result['status'] ?? null,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        logError('WhatsApp mensagem falhou.', [
            'to'      => $this->to,
            'message' => $exception->getMessage(),
        ]);
    }
}
