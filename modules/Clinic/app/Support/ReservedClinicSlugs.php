<?php

namespace Modules\Clinic\Support;

use App\Helpers\ValidationHelper;
use Modules\Clinic\Models\Clinic;

final class ReservedClinicSlugs
{
    public const REGEX = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';

    /**
     * Segmentos técnicos de rotas do SPA/backend e palavras da marca/suporte
     * que não podem ser usados como endereço público de clínica.
     */
    public const SLUGS = [
        'clinica',
        'clinic',
        'admin',
        'paciente',
        'patient',
        'login',
        'auth',
        'register',
        'criar-conta',
        'confirmar-email',
        'recuperar-senha',
        'redefinir-senha',
        'design-system',
        'api',
        'log-viewer',
        'up',
        'storage',
        'build',
        'assets',
        'vendor',
        'sanctum',
        'questionarios',
        'questionnaires',
        'webhook',
        'webhooks',
        'app',
        'www',
        'mail',
        'status',
        'fisioweb',
        'suporte',
        'ajuda',
        'oficial',
        'termos',
        'privacidade',
    ];

    public static function normalize(?string $slug): string
    {
        if (is_null($slug)) {
            return '';
        }

        return mb_strtolower(trim($slug));
    }

    public static function isValidFormat(string $slug): bool
    {
        if (empty($slug) || mb_strlen($slug) > 255) {
            return false;
        }

        return preg_match(self::REGEX, $slug) === 1;
    }

    public static function isReserved(string $slug): bool
    {
        return in_array(self::normalize($slug), self::SLUGS, true);
    }

    /**
     * Regra compartilhada de validação de CPF/CNPJ conforme o `type_person`.
     *
     * @param  \Closure(): string  $typePersonResolver
     */
    public static function documentValidationClosure(\Closure $typePersonResolver): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail) use ($typePersonResolver): void {
            $type   = $typePersonResolver();
            $digits = is_string($value) ? (preg_replace('/\D+/', '', $value) ?? '') : '';

            if ($type === Clinic::TYPE_PERSON_JURIDICA && !ValidationHelper::validateCnpj($digits)) {
                $fail('O campo documento deve ser um CNPJ válido.');
            }

            if ($type === Clinic::TYPE_PERSON_FISICA && !ValidationHelper::validateCpf($digits)) {
                $fail('O campo documento deve ser um CPF válido.');
            }
        };
    }
}
