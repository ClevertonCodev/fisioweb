<?php

namespace Modules\ClinicFinance\Http\Requests;

class StoreFinancialTransactionRequest extends FinancialTransactionRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->baseRules();
    }
}
