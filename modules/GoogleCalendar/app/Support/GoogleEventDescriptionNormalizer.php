<?php

namespace Modules\GoogleCalendar\Support;

/**
 * Google Calendar costuma enviar description em HTML (negrito, &lt;br&gt;, etc.).
 * A agenda do fisioweb usa textarea de texto puro — normaliza na importação.
 */
final class GoogleEventDescriptionNormalizer
{
    public static function toPlainText(?string $description): ?string
    {
        if (is_null($description) || empty(trim($description))) {
            return null;
        }

        $text = $description;
        $text = preg_replace('/<\s*br\s*\/?\s*>/i', "\n", $text) ?? $text;
        $text = preg_replace('/<\s*\/\s*(p|div|li|h[1-6]|tr)\s*>/i', "\n", $text) ?? $text;
        $text = strip_tags($text);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace("/[ \t]+/u", ' ', $text) ?? $text;
        $text = preg_replace("/\n[ \t]+/u", "\n", $text) ?? $text;
        $text = preg_replace("/\n{3,}/u", "\n\n", $text) ?? $text;
        $text = trim($text);

        return empty($text) ? null : $text;
    }
}
