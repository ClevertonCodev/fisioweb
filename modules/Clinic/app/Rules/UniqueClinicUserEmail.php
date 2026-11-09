<?php

namespace Modules\Clinic\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Modules\Clinic\Models\ClinicUser;

/**
 * O login e o broker de senha acham o usuário por LOWER(email): uma variante
 * com outras maiúsculas tomaria o acesso do dono. O e-mail de usuário excluído
 * continua ocupado.
 */
class UniqueClinicUserEmail implements ValidationRule
{
    public function __construct(
        private readonly ?int $ignoreUserId = null,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value)) {
            return;
        }

        $taken = ClinicUser::withTrashed()
            ->whereRaw('LOWER(email) = ?', [mb_strtolower(trim($value))])
            ->when(!is_null($this->ignoreUserId), fn ($query) => $query->whereKeyNot($this->ignoreUserId))
            ->exists();

        if ($taken) {
            $fail('Este e-mail já está em uso.');
        }
    }
}
