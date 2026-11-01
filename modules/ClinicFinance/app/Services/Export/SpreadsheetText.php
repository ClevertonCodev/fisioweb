<?php

namespace Modules\ClinicFinance\Services\Export;

/**
 * Texto livre que vai para uma planilha. Use só em texto: número e data não passam por aqui.
 */
final class SpreadsheetText
{
    /** No CSV, o Excel e o LibreOffice leem como fórmula a célula que começa com um destes. */
    private const CSV_FORMULA_STARTS = ['=', '+', '-', '@', "\t", "\r"];

    /**
     * CSV: começando com =, +, -, @, tab ou CR, ganha um "'" na frente e a célula fica só texto.
     */
    public static function forCsv(?string $text): string
    {
        return self::prefixed((string) $text, self::CSV_FORMULA_STARTS);
    }

    /**
     * Excel: o OpenSpout só grava fórmula quando o texto começa com "=" (o resto já vai como
     * célula de texto, que nunca roda). Só esse ganha o "'"; nos outros ele ficaria visível.
     */
    public static function forXlsx(?string $text): string
    {
        return self::prefixed((string) $text, ['=']);
    }

    /**
     * @param  list<string>  $formulaStarts
     */
    private static function prefixed(string $text, array $formulaStarts): string
    {
        if (!empty($text) && in_array($text[0], $formulaStarts, true)) {
            return "'" . $text;
        }

        return $text;
    }
}
