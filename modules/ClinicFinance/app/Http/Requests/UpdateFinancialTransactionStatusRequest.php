<?php

namespace Modules\ClinicFinance\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;

/**
 * Baixa em um clique (e o "Desfazer"): só o status. Se ele vale para o tipo do
 * lançamento é conferido no Service, depois da posse (404 antes de 422).
 */
class UpdateFinancialTransactionStatusRequest extends FormRequest
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
            'status' => ['required', 'string', Rule::enum(FinancialTransactionStatus::class)],
        ];
    }

    public function status(): FinancialTransactionStatus
    {
        return FinancialTransactionStatus::from((string) $this->validated('status'));
    }
}
