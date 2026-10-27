<?php

namespace Modules\TreatmentProgram\Enums;

enum SatisfactionRating: string
{
    case Pessimo = 'Péssimo';
    case Ruim    = 'Ruim';
    case Medio   = 'Médio';
    case Bom     = 'Bom';
    case Otimo   = 'Ótimo';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
