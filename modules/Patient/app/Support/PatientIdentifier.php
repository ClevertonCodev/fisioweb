<?php

namespace Modules\Patient\Support;

/**
 * Identificador informado no login do paciente: CPF ou e-mail.
 *
 * A classificação acontece pelo formato do valor bruto, antes de qualquer
 * acesso ao banco. Como `patients` tem unique(cpf, clinic_id) e
 * unique(email, clinic_id), identificador + clínica resolve para no máximo
 * um paciente — não há ambiguidade a desempatar.
 *
 * Não há validação de dígito verificador de CPF: rejeitar um CPF
 * matematicamente inválido revelaria, pela diferença de mensagem, quais
 * valores sequer chegam a ser consultados.
 */
final readonly class PatientIdentifier
{
    public const TYPE_EMAIL = 'email';

    public const TYPE_CPF = 'cpf';

    private function __construct(
        public string $type,
        public string $value,
    ) {}

    public static function fromInput(string $input): self
    {
        if (str_contains($input, '@')) {
            return new self(self::TYPE_EMAIL, mb_strtolower(trim($input)));
        }

        return new self(self::TYPE_CPF, preg_replace('/\D/', '', $input));
    }

    /** Coluna de `patients` a consultar para este identificador. */
    public function column(): string
    {
        return $this->type;
    }

    public function isEmail(): bool
    {
        return $this->type === self::TYPE_EMAIL;
    }

    public function isCpf(): bool
    {
        return $this->type === self::TYPE_CPF;
    }

    /** Chave estável para rate limiting (não expõe o valor original). */
    public function throttleKey(): string
    {
        return $this->type . ':' . $this->value;
    }
}
