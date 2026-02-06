<?php

namespace Modules\Cloudflare\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Video extends Model
{
    use HasFactory;
    use SoftDeletes;

    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    protected $table = 'videos';

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
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'duration' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'metadata' => 'array',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Get the owning uploadable model (polymorphic relationship).
     */
    public function uploadable()
    {
        return $this->morphTo();
    }

    /**
     * Scope for completed videos.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope for failed videos.
     */
    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    /**
     * Get the full CDN URL for the video.
     */
    public function getFullCdnUrlAttribute(): ?string
    {
        return $this->cdn_url;
    }

    /**
     * Get human readable size.
     */
    public function getHumanSizeAttribute(): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = $this->size;

        for ($i = 0; $bytes > 1024; ++$i) {
            $bytes /= 1024;
        }

        return round($bytes, 2).' '.$units[$i];
    }

    /**
     * Get human readable duration.
     */
    public function getHumanDurationAttribute(): ?string
    {
        if (!$this->duration) {
            return null;
        }

        $minutes = floor($this->duration / 60);
        $seconds = $this->duration % 60;

        return sprintf('%02d:%02d', $minutes, $seconds);
    }

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory()
    {
        return \Modules\Cloudflare\Database\Factories\VideoFactory::new();
    }
}
