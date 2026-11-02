<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VerifyClinicEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id'        => ['required', 'integer', 'min:1'],
            'hash'      => ['required', 'string', 'max:128'],
            'expires'   => ['required', 'integer', 'min:1'],
            'signature' => ['required', 'string', 'max:255'],
        ];
    }
}
