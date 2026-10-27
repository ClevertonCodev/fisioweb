<?php

namespace Tests\Unit;

use App\Helpers\ValidationHelper;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ValidationHelperCrefitoTest extends TestCase
{
    #[DataProvider('validCrefitoProvider')]
    public function test_accepts_valid_crefito_registrations(string $document): void
    {
        $this->assertTrue(ValidationHelper::isCrefitoRegistrationFormat($document));
    }

    #[DataProvider('invalidCrefitoProvider')]
    public function test_rejects_invalid_crefito_registrations(string $document): void
    {
        $this->assertFalse(ValidationHelper::isCrefitoRegistrationFormat($document));
    }

    public function test_clinic_user_identification_accepts_real_crefito(): void
    {
        $this->assertNull(ValidationHelper::validateClinicUserIdentification('123456-F'));
    }

    public function test_clinic_user_identification_rejects_garbage(): void
    {
        $this->assertNotNull(ValidationHelper::validateClinicUserIdentification('abc-def'));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function validCrefitoProvider(): array
    {
        return [
            'fisioterapeuta com sufixo -F' => ['123456-F'],
            'fisioterapeuta sem separador' => ['123456F'],
            'terapeuta ocupacional -TO'    => ['12345-TO'],
            'com regiao'                   => ['3/12345-F'],
            'com prefixo CREFITO'          => ['CREFITO-3/12345-F'],
            'com prefixo e espaco'         => ['CREFITO 3/12345-TO'],
            'legado UF + numero'           => ['MG-123456'],
            'legado UF com sufixo'         => ['SP 123456-G'],
        ];
    }

    /**
     * @return array<string, array{string}>
     */
    public static function invalidCrefitoProvider(): array
    {
        return [
            'apenas numero'   => ['123456'],
            'vazio'           => [''],
            'curto demais'    => ['12F'],
            'texto livre'     => ['fisioterapeuta'],
            'sem digitos'     => ['abc-def'],
            'longo demais'    => ['CREFITOOOOOOOOOOOOOOOOOOOOOOOOO-F'],
        ];
    }
}
