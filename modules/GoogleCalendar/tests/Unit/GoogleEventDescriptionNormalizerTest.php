<?php

namespace Modules\GoogleCalendar\Tests\Unit;

use Modules\GoogleCalendar\Support\GoogleEventDescriptionNormalizer;
use Tests\TestCase;

class GoogleEventDescriptionNormalizerTest extends TestCase
{
    public function test_strips_google_html_and_keeps_line_breaks(): void
    {
        $html = '<u></u><u></u><b>Alinhamento semanal de tarefas</b><br><b><br></b><br>15 minutos definição de pauta';

        $plain = GoogleEventDescriptionNormalizer::toPlainText($html);

        $this->assertSame(
            "Alinhamento semanal de tarefas\n\n15 minutos definição de pauta",
            $plain,
        );
    }

    public function test_decodes_html_entities(): void
    {
        $plain = GoogleEventDescriptionNormalizer::toPlainText('A &amp; B &lt; C');

        $this->assertSame('A & B < C', $plain);
    }

    public function test_returns_null_for_empty_or_tag_only_content(): void
    {
        $this->assertNull(GoogleEventDescriptionNormalizer::toPlainText(null));
        $this->assertNull(GoogleEventDescriptionNormalizer::toPlainText(''));
        $this->assertNull(GoogleEventDescriptionNormalizer::toPlainText('<u></u><b></b>'));
    }
}
