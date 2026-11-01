<?php

namespace Modules\ClinicFinance\Support;

/**
 * Divide o valor e a taxa de um parcelamento em centavos: cada parcela fica com
 * o total ÷ N truncado, e o centavo que sobra vai na 1ª (R$ 100 em 3x =
 * 33,34 + 33,33 + 33,33). A taxa segue a mesma regra e nunca passa do valor da
 * parcela (o excesso, que só aparece com taxa quase igual ao valor, vai para as
 * seguintes).
 */
final class InstallmentSplit
{
    /**
     * @return list<array{gross: string, fee: string}>
     */
    public static function of(float|string $gross, float|string $fee, int $total): array
    {
        $grossParts = self::cents(self::toCents($gross), $total);
        $feeParts   = self::cents(self::toCents($fee), $total);

        $excess = 0;
        foreach ($feeParts as $i => $part) {
            $part += $excess;
            $excess       = max(0, $part - $grossParts[$i]);
            $feeParts[$i] = $part - $excess;
        }

        return array_map(
            fn (int $g, int $f) => ['gross' => self::toMoney($g), 'fee' => self::toMoney($f)],
            $grossParts,
            $feeParts,
        );
    }

    /**
     * @return list<int>
     */
    private static function cents(int $amount, int $total): array
    {
        $base  = intdiv($amount, $total);
        $parts = array_fill(0, $total, $base);
        $parts[0] += $amount - $base * $total;

        return $parts;
    }

    private static function toCents(float|string $value): int
    {
        return (int) round(((float) $value) * 100);
    }

    private static function toMoney(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }
}
