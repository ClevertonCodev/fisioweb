<?php

namespace Modules\ClinicFinance\Http\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Validation\Rule;
use Modules\ClinicFinance\Data\TransactionRepeat;
use Modules\ClinicFinance\Enums\RecurrenceFrequency;
use Modules\ClinicFinance\Support\RecurrenceSchedule;

class StoreFinancialTransactionRequest extends FinancialTransactionRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            ...$this->baseRules(),
            // "Repetir": não repete, parcelado de 2 a 48 vezes ou recorrente (semanal, mensal
            // ou anual, sem fim ou até uma data a partir da 1ª).
            'repeat'           => ['sometimes', 'array'],
            'repeat.kind'      => ['required_with:repeat', Rule::in(['none', 'installments', 'recurrence'])],
            'repeat.total'     => ['exclude_unless:repeat.kind,installments', 'required', 'integer', 'between:2,48'],
            'repeat.frequency' => ['exclude_unless:repeat.kind,recurrence', 'required', Rule::enum(RecurrenceFrequency::class)],
            'repeat.ends_on'   => ['exclude_unless:repeat.kind,recurrence', 'nullable', 'date', 'after_or_equal:date'],
        ];
    }

    public function withValidator($validator): void
    {
        parent::withValidator($validator);

        // A recorrência começa no máximo 12 meses atrás: senão criaria centenas de
        // ocorrências atrasadas de uma vez.
        $validator->after(function ($validator) {
            if ($this->input('repeat.kind') !== 'recurrence' || $validator->errors()->has('date')) {
                return;
            }
            $date     = CarbonImmutable::parse((string) $this->input('date'))->startOfDay();
            $earliest = CarbonImmutable::today()->subMonthsNoOverflow(RecurrenceSchedule::MONTHS_AHEAD);
            if ($date->lessThan($earliest)) {
                $validator->errors()->add('date', 'A recorrência começa no máximo 12 meses atrás.');
            }
        });

        // Cada parcela leva pelo menos R$ 0,01: R$ 0,02 em 3x daria parcelas de R$ 0,00.
        $validator->after(function ($validator) {
            $errors = $validator->errors();
            if ($this->input('repeat.kind') !== 'installments' || $errors->has('gross_amount') || $errors->has('repeat.total')) {
                return;
            }
            $total = (int) $this->input('repeat.total');
            if ((int) round(((float) $this->input('gross_amount')) * 100) < $total) {
                $errors->add('gross_amount', "Em {$total} parcelas, o valor precisa ser de pelo menos R$ " . number_format($total / 100, 2, ',', '.') . '.');
            }
        });
    }

    /** Os campos do lançamento, sem o `repeat`. */
    public function transactionData(): array
    {
        return collect($this->validated())->except('repeat')->all();
    }

    public function repeat(): TransactionRepeat
    {
        return TransactionRepeat::fromArray($this->validated('repeat'));
    }
}
