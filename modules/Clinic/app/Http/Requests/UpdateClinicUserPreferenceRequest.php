<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Clinic\Enums\ClinicUserPreferenceKey;

/**
 * A chave vem da rota e precisa estar registrada; o valor segue a regra da chave.
 */
class UpdateClinicUserPreferenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['key' => $this->route('key')]);
    }

    public function rules(): array
    {
        $key = ClinicUserPreferenceKey::tryFrom((string) $this->route('key'));

        return [
            'key'   => ['required', 'string', Rule::in(ClinicUserPreferenceKey::values())],
            'value' => is_null($key) ? ['nullable'] : $key->valueRules(),
        ];
    }

    public function preferenceKey(): ClinicUserPreferenceKey
    {
        return ClinicUserPreferenceKey::from($this->validated('key'));
    }
}
