<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExportFinancialTransactionsRequest extends FormRequest
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
            'format' => ['required', Rule::in(['csv', 'xlsx', 'pdf'])],
            'range'  => ['required', Rule::in(['current_month', 'previous_month', 'custom'])],
            'from'   => ['required_if:range,custom', 'nullable', 'date'],
            'to'     => ['required_if:range,custom', 'nullable', 'date', 'after_or_equal:from'],
        ];
    }
}
