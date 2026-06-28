<?php

namespace Modules\ClinicFinance\Enums;

enum PaymentMethod: string
{
    case Dinheiro       = 'dinheiro';
    case Pix            = 'pix';
    case CartaoDebito   = 'cartao_debito';
    case CartaoCredito  = 'cartao_credito';
    case Transferencia  = 'transferencia';
    case Boleto         = 'boleto';
    case Outro          = 'outro';

    public function label(): string
    {
        return match ($this) {
            self::Dinheiro      => 'Dinheiro',
            self::Pix           => 'Pix',
            self::CartaoDebito  => 'Cartão de débito',
            self::CartaoCredito => 'Cartão de crédito',
            self::Transferencia => 'Transferência',
            self::Boleto        => 'Boleto',
            self::Outro         => 'Outro',
        };
    }
}
