<?php

namespace Modules\ClinicFinance\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\ClinicFinance\Enums\SeriesScope;

/** `DELETE transactions/{id}?scope=only|following`. A Policy é chamada no controller. */
class DestroyFinancialTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'scope' => ['sometimes', Rule::enum(SeriesScope::class)],
        ];
    }

    public function scope(): SeriesScope
    {
        return SeriesScope::tryFrom((string) $this->validated('scope')) ?? SeriesScope::Only;
    }
}
