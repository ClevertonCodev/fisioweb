<?php

namespace Modules\ClinicScheduling\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\ClinicScheduling\Enums\AppointmentEmailKind;

class SendAppointmentEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kind' => ['required', Rule::enum(AppointmentEmailKind::class)],
        ];
    }

    public function kind(): AppointmentEmailKind
    {
        return AppointmentEmailKind::from($this->input('kind'));
    }
}
