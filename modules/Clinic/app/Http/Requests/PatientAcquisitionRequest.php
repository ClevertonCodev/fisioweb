<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Clinic\Services\DashboardScope;

class PatientAcquisitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'scope' => ['nullable', 'string', 'in:' . DashboardScope::SCOPE_CLINIC . ',' . DashboardScope::SCOPE_MINE],
        ];
    }
}
