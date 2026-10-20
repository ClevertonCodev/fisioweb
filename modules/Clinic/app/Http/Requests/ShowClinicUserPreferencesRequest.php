<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Clinic\Enums\ClinicUserPreferenceKey;

/**
 * `?keys=agenda.view,agenda.show_weekends`: só chaves registradas.
 */
class ShowClinicUserPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $keys = $this->query('keys');

        $this->merge([
            'keys' => is_string($keys)
                ? array_values(array_filter(array_map('trim', explode(',', $keys)), fn ($k) => !empty($k)))
                : $keys,
        ]);
    }

    public function rules(): array
    {
        return [
            'keys'   => ['required', 'array', 'max:20'],
            'keys.*' => ['string', Rule::in(ClinicUserPreferenceKey::values())],
        ];
    }

    /**
     * @return list<ClinicUserPreferenceKey>
     */
    public function preferenceKeys(): array
    {
        return array_map(
            fn (string $key) => ClinicUserPreferenceKey::from($key),
            array_values(array_unique($this->validated('keys'))),
        );
    }
}
