<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Clinic\Enums\AppointmentStatus;

class UpdateAppointmentStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Autorização efetiva via AppointmentPolicy no controller.
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(AppointmentStatus::class)],
        ];
    }

    public function status(): AppointmentStatus
    {
        return AppointmentStatus::from($this->input('status'));
    }
}
