<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Feature extends Model
{
    protected $table = 'features';

    public const KEY_VIDEO_CALL = 'video_call';

    public const ALLOWED_KEYS = [
        self::KEY_VIDEO_CALL => 'Vídeo',
        'teste'              => 'teste',
        'teste2'             => 'teste2',
        'teste3'             => 'teste3',
        'teste4'             => 'teste4',
        'teste5'             => 'teste5',
        'teste6'             => 'teste6',
        'teste7'             => 'teste7',
        'teste8'             => 'teste8',
        'teste9'             => 'teste9',
        'teste10'            => 'teste10',
    ];

    public const TYPES = [
        'bool' => 'Ativa/Inativa',
        'int'  => 'Quantidade',
    ];

    protected $fillable = [
        'key',
        'name',
        'value_isolated',
        'type',
    ];

    protected function casts(): array
    {
        return [
            'value_isolated' => 'decimal:2',
        ];
    }

    public function featurePlans(): HasMany
    {
        return $this->hasMany(FeaturePlan::class, 'feature_id');
    }

    public static function allowedKeys(): array
    {
        return self::ALLOWED_KEYS;
    }

    public static function isKeyAllowed(string $key): bool
    {
        return array_key_exists($key, self::ALLOWED_KEYS);
    }

    public static function availableTypes(): array
    {
        return self::TYPES;
    }
}
