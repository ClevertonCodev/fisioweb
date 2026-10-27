<?php

namespace Modules\ClinicScheduling\Data;

/**
 * Item da lista enviada para substituir os tipos (`id` nulo = tipo novo).
 */
final readonly class ServiceTypeData
{
    public function __construct(
        public ?int $id,
        public string $name,
        public int $durationMinutes,
    ) {}

    /**
     * @param  array{id?: int|string|null, name: string, duration_minutes: int|string}  $item
     */
    public static function fromArray(array $item): self
    {
        return new self(
            !empty($item['id']) ? (int) $item['id'] : null,
            trim((string) $item['name']),
            (int) $item['duration_minutes'],
        );
    }
}
