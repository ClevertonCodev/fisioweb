<?php

namespace Modules\Media\Contracts;

/**
 * Proposta de mídia de um vídeo travado, com a mídia em uso ao lado, para o operador revisar.
 * O `version` muda a cada troca da proposta: aprovar e rejeitar exigem a versão que o operador viu.
 */
final readonly class MediaProposal
{
    /**
     * @param  list<array{file_path: string, cdn_url: string, original_filename: string, mime_type: string, size: int}>  $currentReferenceImages
     * @param  list<array{file_path: string, cdn_url: string, original_filename: string, mime_type: string, size: int}>|null  $proposedReferenceImages  nulo quando a proposta não troca as imagens
     */
    public function __construct(
        public int $videoId,
        public ?int $ownerClinicId,
        public string $version,
        public string $proposedAt,
        public ?int $proposedByClinicUserId,
        public ?string $currentThumbnailUrl,
        public array $currentReferenceImages,
        public ?string $proposedThumbnailUrl,
        public ?array $proposedReferenceImages,
    ) {}

    /**
     * @return array{video_id: int, proposal_version: string, proposed_at: string, proposed_by_clinic_user_id: int|null, current: array{thumbnail_url: string|null, reference_images: list<array{file_path: string, cdn_url: string, original_filename: string, mime_type: string, size: int}>}, proposed: array{thumbnail_url: string|null, reference_images: list<array{file_path: string, cdn_url: string, original_filename: string, mime_type: string, size: int}>|null}}
     */
    public function toArray(): array
    {
        return [
            'video_id'                   => $this->videoId,
            'proposal_version'           => $this->version,
            'proposed_at'                => $this->proposedAt,
            'proposed_by_clinic_user_id' => $this->proposedByClinicUserId,
            'current'                    => [
                'thumbnail_url'    => $this->currentThumbnailUrl,
                'reference_images' => $this->currentReferenceImages,
            ],
            'proposed' => [
                'thumbnail_url'    => $this->proposedThumbnailUrl,
                'reference_images' => $this->proposedReferenceImages,
            ],
        ];
    }
}
