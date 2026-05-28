<?php

namespace Modules\WhatsApp\Contracts;

interface WhatsAppServiceInterface
{
    /**
     * @return array{sid: string, status: string}
     */
    public function send(string $to, string $body, ?string $mediaUrl = null): array;

    public function isConfigured(): bool;

    public static function normalizePhone(string $phone, string $countryCode = '55'): string;
}
