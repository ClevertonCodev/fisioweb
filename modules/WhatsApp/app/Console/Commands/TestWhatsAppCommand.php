<?php

namespace Modules\WhatsApp\Console\Commands;

use Illuminate\Console\Command;
use Modules\WhatsApp\Contracts\WhatsAppServiceInterface;

class TestWhatsAppCommand extends Command
{
    protected $signature = 'whatsapp:test {phone : Número de destino no formato brasileiro}';

    protected $description = 'Testa envio de WhatsApp via Twilio';

    public function handle(WhatsAppServiceInterface $whatsAppService): int
    {
        $phone = (string) $this->argument('phone');
        $to    = $whatsAppService::normalizePhone($phone);

        if (!$whatsAppService->isConfigured()) {
            $this->error('WhatsApp não está configurado. Revise WHATSAPP_ENABLED e TWILIO_* no .env.');

            return self::FAILURE;
        }

        $result = $whatsAppService->send(
            to: $to,
            body: 'Mensagem de teste enviada pelo comando whatsapp:test.',
        );

        $this->info('Mensagem enviada com sucesso.');
        $this->table(['Campo', 'Valor'], [
            ['To', $to],
            ['SID', $result['sid'] ?? '-'],
            ['Status', $result['status'] ?? '-'],
        ]);

        return self::SUCCESS;
    }
}
