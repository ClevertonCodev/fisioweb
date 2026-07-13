<?php

namespace Modules\Admin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Feature extends Model
{
    protected $table = 'admin_features';

    public const KEY_AGENDA = 'agenda';

    public const KEY_PROGRAMAS_EXERCICIOS = 'programas_exercicios';

    public const KEY_FINANCAS = 'financas';

    public const KEY_APP = 'app';

    public const ALLOWED_KEYS = [
        self::KEY_AGENDA               => 'Agenda',
        self::KEY_PROGRAMAS_EXERCICIOS => 'Programas e Exercícios',
        self::KEY_FINANCAS             => 'Finanças',
        self::KEY_APP                  => 'App',
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
