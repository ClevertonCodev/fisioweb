<?php

namespace Modules\Patient\Support;

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

    public function throttleKey(): string
    {
        return $this->type . ':' . $this->value;
    }
}
