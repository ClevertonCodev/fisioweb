<?php

namespace Modules\Clinic\Enums;

enum FinancialTransactionStatus: string
{
    case Recebido = 'recebido';
    case Pendente = 'pendente';
    case Pago     = 'pago';

    public function label(): string
    {
        return match ($this) {
            self::Recebido => 'Recebido',
            self::Pendente => 'Pendente',
            self::Pago     => 'Pago',
        };
    }

    public function isValidFor(FinancialTransactionType $type): bool
    {
        return match ($type) {
            FinancialTransactionType::Entrada => in_array($this, [self::Recebido, self::Pendente], true),
            FinancialTransactionType::Saida   => in_array($this, [self::Pago, self::Pendente], true),
        };
    }
}
