<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Feature extends Model
{
    use HasFactory;

    protected $table = 'functionalities';

    public const KEY_VIDEO_CALL = 'video_call';
    public const ALLOWED_KEYS = [
        self::KEY_VIDEO_CALL => 'Vídeo',
    ];
    /** Tipos permitidos para funcionalidades */
    public const TYPES = [
        'bool' => 'Ativa/Inativa',
        'int' => 'Quantidade',
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

    /**
     * Retorna as chaves permitidas para cadastro.
     *
     * @return array<string, string> [key => label]
     */
    public static function allowedKeys(): array
    {
        return self::ALLOWED_KEYS;
    }

    /**
     * Verifica se a chave é permitida.
     */
    public static function isKeyAllowed(string $key): bool
    {
        return array_key_exists($key, self::ALLOWED_KEYS);
    }

    public static function availableTypes(): array
    {
        return self::TYPES;
    }
}
