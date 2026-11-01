<?php

namespace Modules\ClinicFinance\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\ClinicFinance\Enums\FinancialTransactionType;

class ListFinancialTransactionsRequest extends FormRequest
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
            // Fim do mês na tela: "a receber"/"a pagar" com as atrasadas de antes.
            'overdue_until' => ['sometimes', 'date_format:Y-m-d'],
            // Busca em todo o histórico (sem `period`/`from`/`to`), com filtro opcional por tipo.
            'q'             => ['sometimes', 'nullable', 'string', 'max:100'],
            'type'          => ['sometimes', 'nullable', Rule::enum(FinancialTransactionType::class)],
        ];
    }
}
