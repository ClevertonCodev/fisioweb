<?php

namespace Modules\ClinicFinance\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\ClinicFinance\Enums\FinancialTransactionStatus;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Enums\PaymentMethod;

abstract class FinancialTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    protected function baseRules(): array
    {
        $type = FinancialTransactionType::tryFrom((string) $this->input('type'));

        $statusRule = ['required', Rule::enum(FinancialTransactionStatus::class)];
        if (!is_null($type)) {
            $statusRule[] = function (string $attribute, mixed $value, \Closure $fail) use ($type) {
                $status = FinancialTransactionStatus::tryFrom((string) $value);
                if (is_null($status) || !$status->isValidFor($type)) {
                    $fail('Status inválido para o tipo de transação informado.');
                }
            };
        }

        return [
            'date'                   => ['required', 'date', 'before_or_equal:' . now()->addYear()->toDateString()],
            'description'            => ['required', 'string', 'max:255'],
            'financial_category_id'  => ['required', 'integer', 'exists:clinic_financial_categories,id'],
            'type'                   => ['required', Rule::enum(FinancialTransactionType::class)],
            'status'                 => $statusRule,
            'payment_method'         => ['required', Rule::enum(PaymentMethod::class)],
            'gross_amount'           => ['required', 'numeric', 'gt:0'],
            'fee_amount'             => ['nullable', 'numeric', 'gte:0'],
            'notes'                  => ['nullable', 'string'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (!$this->has('fee_amount')) {
            $this->merge(['fee_amount' => 0]);
        }
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $gross = (float) $this->input('gross_amount', 0);
            $fee   = (float) $this->input('fee_amount', 0);
            if ($fee > $gross) {
                $validator->errors()->add('fee_amount', 'A taxa não pode ser maior que o valor bruto.');
            }
        });
    }
}
