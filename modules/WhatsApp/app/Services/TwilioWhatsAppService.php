<?php

namespace Modules\WhatsApp\Services;

use Modules\WhatsApp\Contracts\WhatsAppServiceInterface;
use RuntimeException;
use Twilio\Rest\Client;

class TwilioWhatsAppService implements WhatsAppServiceInterface
{
    public function send(string $to, string $body, ?string $mediaUrl = null): array
    {
        if (!$this->isConfigured()) {
            throw new RuntimeException('WhatsApp/Twilio is not configured.');
        }

        $sid   = (string) config('whatsapp.twilio_sid');
        $token = (string) config('whatsapp.twilio_token');
        $from  = self::normalizePhone((string) config('whatsapp.from_number'));
        $to    = self::normalizePhone($to);

        $client  = new Client($sid, $token);
        $payload = [
            'from' => 'whatsapp:' . $from,
            'body' => $body,
        ];

        if (!empty($mediaUrl)) {
            $payload['mediaUrl'] = [$mediaUrl];
        }

        $message = $client->messages->create('whatsapp:' . $to, $payload);

        return [
            'sid'    => $message->sid,
            'status' => (string) $message->status,
        ];
    }

    public function isConfigured(): bool
    {
        return (bool) config('whatsapp.enabled')
            && (string) config('whatsapp.twilio_sid') !== ''
            && (string) config('whatsapp.twilio_token') !== ''
            && (string) config('whatsapp.from_number') !== '';
    }

    public static function normalizePhone(string $phone, string $countryCode = '55'): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if ($digits === '') {
            return '';
        }

        if (str_starts_with($digits, $countryCode)) {
            return '+' . $digits;
        }

        return '+' . $countryCode . $digits;
    }
}
