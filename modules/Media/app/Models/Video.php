<?php

namespace Modules\Media\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Video extends Model
{
    use HasFactory;
    use SoftDeletes;

    public const STATUS_PENDING = 'pending';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_FAILED = 'failed';

    public const MEDIA_PROPOSAL_KEYS = ['proposed_thumbnail_path', 'proposed_reference_images', 'proposed_at', 'proposed_by_clinic_user_id'];

    protected $table = 'media_videos';

    protected $fillable = [
        'filename',
        'original_filename',
        'path',
        'url',
        'cdn_url',
        'mime_type',
        'size',
        'duration',
        'width',
        'height',
        'thumbnail_path',
        'thumbnail_url',
        'status',
        'uploadable_type',
        'uploadable_id',
        'clinic_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'size'      => 'integer',
            'duration'  => 'integer',
            'width'     => 'integer',
            'height'    => 'integer',
            'clinic_id' => 'integer',
            'metadata'  => 'array',
        ];
    }

    public function uploadable(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopeFailed(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeProcessing(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PROCESSING);
    }

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function getHumanSizeAttribute(): string
    {
        $bytes = $this->size ?? 0;

        if ($bytes === 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i     = (int) floor(log($bytes, 1024));

        return round($bytes / (1024 ** $i), 2) . ' ' . $units[$i];
    }

    public function getHumanDurationAttribute(): ?string
    {
        if (!$this->duration) {
            return null;
        }

        $minutes = intdiv($this->duration, 60);
        $seconds = $this->duration % 60;

        return sprintf('%02d:%02d', $minutes, $seconds);
    }

    /**
     * A proposta de mídia ainda não foi revisada: o vídeo chega às outras clínicas pelas relações dos exercícios, então ela não sai na serialização.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $attributes = parent::toArray();

        if (is_array($attributes['metadata'] ?? null)) {
            $attributes['metadata'] = array_diff_key($attributes['metadata'], array_flip(self::MEDIA_PROPOSAL_KEYS));
        }

        return $attributes;
    }

    protected static function newFactory(): \Modules\Media\Database\Factories\VideoFactory
    {
        return \Modules\Media\Database\Factories\VideoFactory::new();
    }
}
