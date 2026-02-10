<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExerciseMedia extends Model
{
    public const TYPE_IMAGE = 'image';
    public const TYPE_GIF = 'gif';
    public const TYPE_AUDIO = 'audio';

    public const TYPES = [
        self::TYPE_IMAGE => 'Imagem',
        self::TYPE_GIF => 'GIF',
        self::TYPE_AUDIO => 'Áudio',
    ];

    protected $table = 'exercise_media';

    protected $fillable = [
        'exercise_id',
        'type',
        'file_path',
        'cdn_url',
        'original_filename',
        'mime_type',
        'size',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
