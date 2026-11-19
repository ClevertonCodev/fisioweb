<?php

namespace Modules\Email\Tests\Feature;

use Illuminate\Mail\Markdown;
use Tests\TestCase;

class ClinicEmailComponentsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        view()->addNamespace('emailtest', __DIR__ . '/fixtures');
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function html(array $overrides = [], string $view = 'clinic-message'): string
    {
        return (string) app(Markdown::class)->render('emailtest::' . $view, $this->data($overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function data(array $overrides): array
    {
        return array_merge([
            'sender' => 'Clínica Teste',
            'badge'  => 'Programa de exercícios',
            'rows'   => [['Início', '18/11/2026'], ['Exercícios', '6']],
            'author' => 'Rafael Lima',
            'role'   => 'Fisioterapeuta',
            'quote'  => 'Faça 3 vezes por semana.',
        ], $overrides);
    }

    public function test_clinic_name_in_header_and_footer_is_plain_text(): void
    {
        $html = $this->html(['sender' => '[Clique aqui](https://evil.test)'], 'clinic-plain');

        $this->assertStringNotContainsString('href="https://evil.test"', $html);
        $this->assertStringContainsString('via IVS MED', $html);
        $this->assertStringContainsString('Este endereço não recebe respostas.', $html);
    }

    public function test_details_block_and_quote_render_with_the_theme_and_escape_content(): void
    {
        $html = $this->html([
            'rows'  => [['Início', '18/11/2026'], ['Exercícios', '<b>6</b>']],
            'quote' => 'Faça [isto](https://evil.test) 3 vezes.',
        ]);

        $this->assertStringContainsString('class="details"', $html);
        $this->assertStringContainsString('Início', $html);
        $this->assertStringContainsString('18/11/2026', $html);
        $this->assertStringContainsString('&lt;b&gt;6&lt;/b&gt;', $html);
        $this->assertStringContainsString('class="quote"', $html);
        $this->assertStringContainsString('Rafael Lima · Fisioterapeuta', $html);
        $this->assertStringNotContainsString('href="https://evil.test"', $html);
        $this->assertMatchesRegularExpression('/class="details"[^>]*style="[^"]*background-color: #f4f6fb/', $html);
        $this->assertMatchesRegularExpression('/class="quote-cell"[^>]*style="[^"]*border-left: 3px solid #afbee3/', $html);
        $this->assertStringContainsString('Programa de exercícios', $html);
    }

    public function test_plain_text_version_has_the_new_brand_details_and_quote(): void
    {
        $text = (string) app(Markdown::class)->renderText('emailtest::clinic-message', $this->data([]));

        $this->assertStringContainsString('Clínica Teste via IVS MED', $text);
        $this->assertStringContainsString('Início: 18/11/2026', $text);
        $this->assertStringContainsString('Faça 3 vezes por semana.', $text);
        $this->assertStringContainsString('Rafael Lima · Fisioterapeuta', $text);
        $this->assertStringContainsString('Enviado pela IVS MED em nome da Clínica Teste. Este endereço não recebe respostas.', $text);
        $this->assertStringNotContainsString('Todos os direitos reservados', $text);
        $this->assertStringNotContainsString('All rights reserved', $text);
    }

    public function test_details_with_blank_lines_never_turn_into_markdown(): void
    {
        $html = $this->html([
            'rows' => [
                ["Obs\n\n[rótulo](https://evil.test/label)", "linha\n\n[valor](https://evil.test/value)\n\n# Título"],
            ],
            'quote' => "Faça isso.\n\n[citação](https://evil.test/quote)\r\n\r\n# Outro",
        ]);

        $this->assertStringNotContainsString('href="https://evil.test', $html);
        $this->assertStringNotContainsString('<h1>Título', $html);
        $this->assertStringContainsString('[valor](https://evil.test/value)', html_entity_decode($html));
    }

    public function test_plain_text_quote_and_details_show_special_characters_once(): void
    {
        $text = (string) app(Markdown::class)->renderText('emailtest::clinic-message', $this->data([
            'rows'  => [['Local', 'Rua A & B "centro"']],
            'quote' => 'Faça 3x & descanse "já", O\'Neil.',
        ]));

        $this->assertStringContainsString('Faça 3x & descanse "já", O\'Neil.', $text);
        $this->assertStringContainsString('Local: Rua A & B "centro"', $text);
        $this->assertDoesNotMatchRegularExpression('/&(amp|quot|#0?39);/', $text);
    }
}
