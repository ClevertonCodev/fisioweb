<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Clinic\Services\OccupancyRateService;

class OccupancyRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'granularity'    => ['required', 'string', 'in:' . implode(',', OccupancyRateService::GRANULARITIES)],
            'clinic_user_id' => ['nullable', 'integer'],
        ];
    }
}
