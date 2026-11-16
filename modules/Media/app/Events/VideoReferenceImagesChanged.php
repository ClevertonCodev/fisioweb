<?php

namespace Modules\Media\Events;

use Carbon\CarbonImmutable;

final readonly class VideoReferenceImagesChanged
{
    /**
     * @param  list<array{file_path: string, cdn_url: string, original_filename: string, mime_type: string, size: int}>  $images
     */
    public function __construct(
        public int $version,
        public int $videoId,
        public ?int $ownerClinicId,
        public bool $changedByOperator,
        public array $images,
        public CarbonImmutable $occurredAt,
    ) {}
}
