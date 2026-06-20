<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePeriodOpeningBalanceRequest extends FormRequest
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
            'year'   => ['required', 'integer', 'min:2000', 'max:2100'],
            'month'  => ['required', 'integer', 'min:1', 'max:12'],
            'amount' => ['required', 'numeric'],
        ];
    }
}
