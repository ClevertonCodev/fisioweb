<?php

namespace Modules\ClinicFinance\Http\Requests;

use Illuminate\Validation\Rule;
use Modules\ClinicFinance\Enums\SeriesScope;

class UpdateFinancialTransactionRequest extends FinancialTransactionRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            ...$this->baseRules(),
            // Parcela: "só esta" (padrão) ou "esta e as próximas" pendentes.
            'scope' => ['sometimes', Rule::enum(SeriesScope::class)],
        ];
    }

    /** Os campos do lançamento, sem o `scope`. A repetição não muda na edição. */
    public function transactionData(): array
    {
        return collect($this->validated())->except('scope')->all();
    }

    public function scope(): SeriesScope
    {
        return SeriesScope::tryFrom((string) $this->validated('scope')) ?? SeriesScope::Only;
    }
}
