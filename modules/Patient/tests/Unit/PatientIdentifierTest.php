<?php

namespace Modules\Patient\Tests\Unit;

use Modules\Patient\Support\PatientIdentifier;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class PatientIdentifierTest extends TestCase
{
    public static function cpfProvider(): array
    {
        return [
            'com mascara'       => ['123.456.789-00'],
            'com espacos'       => ['123 456 789 00'],
            'apenas digitos'    => ['12345678900'],
            'mascara e espacos' => [' 123.456.789-00 '],
        ];
    }

    #[DataProvider('cpfProvider')]
    public function test_normaliza_cpf_para_apenas_digitos(string $input): void
    {
        $identifier = PatientIdentifier::fromInput($input);

        $this->assertSame(PatientIdentifier::TYPE_CPF, $identifier->type);
        $this->assertSame('12345678900', $identifier->value);
        $this->assertSame('cpf', $identifier->column());
        $this->assertTrue($identifier->isCpf());
        $this->assertFalse($identifier->isEmail());
    }

    public static function emailProvider(): array
    {
        return [
            'caixa mista e espacos' => ['  Joao@Clinica.COM '],
            'caixa alta'            => ['JOAO@CLINICA.COM'],
            'ja normalizado'        => ['joao@clinica.com'],
        ];
    }

    #[DataProvider('emailProvider')]
    public function test_normaliza_email_para_minusculas_sem_espacos(string $input): void
    {
        $identifier = PatientIdentifier::fromInput($input);

        $this->assertSame(PatientIdentifier::TYPE_EMAIL, $identifier->type);
        $this->assertSame('joao@clinica.com', $identifier->value);
        $this->assertSame('email', $identifier->column());
        $this->assertTrue($identifier->isEmail());
        $this->assertFalse($identifier->isCpf());
    }

    public function test_classifica_pelo_arroba_e_nao_por_tentativa(): void
    {
        $this->assertSame(PatientIdentifier::TYPE_EMAIL, PatientIdentifier::fromInput('a@b')->type);
        $this->assertSame(PatientIdentifier::TYPE_CPF, PatientIdentifier::fromInput('abc123')->type);
    }

    public function test_cpf_invalido_nao_e_rejeitado_apenas_normalizado(): void
    {
        // mensagem, quais valores sequer chegam a ser consultados.
        $identifier = PatientIdentifier::fromInput('000.000.000-00');

        $this->assertSame('00000000000', $identifier->value);
    }

    public function test_throttle_key_diferencia_tipo(): void
    {
        $this->assertSame('cpf:12345678900', PatientIdentifier::fromInput('123.456.789-00')->throttleKey());
        $this->assertSame('email:a@b.com', PatientIdentifier::fromInput('A@B.com')->throttleKey());
    }
}
