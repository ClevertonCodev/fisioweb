<?php

namespace Modules\ClinicFinance\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Apagar o saldo digitado de um mês (`?period=YYYY-MM`) e voltar ao calculado. */
class ClearPeriodOpeningBalanceRequest extends FormRequest
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
            'period' => ['required', 'string', 'date_format:Y-m'],
        ];
    }

    /**
     * @return array{0: int, 1: int}
     */
    public function yearAndMonth(): array
    {
        [$year, $month] = array_map('intval', explode('-', (string) $this->validated('period')));

        return [$year, $month];
    }
}
