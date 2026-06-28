<?php

namespace Modules\ClinicFinance\Enums;

enum FinancialTransactionType: string
{
    case Entrada = 'entrada';
    case Saida   = 'saida';

    public function label(): string
    {
        return match ($this) {
            self::Entrada => 'Entrada',
            self::Saida   => 'Saída',
        };
    }
}
