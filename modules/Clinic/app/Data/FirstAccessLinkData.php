<?php

namespace Modules\Clinic\Data;

use Carbon\CarbonInterface;

final readonly class FirstAccessLinkData
{
    public function __construct(
        public string $url,
        public CarbonInterface $createdAt,
    ) {}

    /**
     * @return array{url: string, created_at: string}
     */
    public function toArray(): array
    {
        return [
            'url'        => $this->url,
            'created_at' => $this->createdAt->toIso8601String(),
        ];
    }
}
