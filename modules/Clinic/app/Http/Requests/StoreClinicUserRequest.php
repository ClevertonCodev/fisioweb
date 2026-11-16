<?php

namespace Modules\Clinic\Http\Requests;

use App\Helpers\ValidationHelper;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Rules\UniqueClinicUserEmail;

class StoreClinicUserRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => mb_strtolower(trim($this->input('email')))]);
        }
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', new UniqueClinicUserEmail],
            'password' => ['required', 'string', 'min:8'],
            'role'     => ['required', 'string', 'in:' . implode(',', array_keys(ClinicUser::ROLES))],
            'document' => [
                'required',
                'string',
                'max:30',
                function (string $attribute, mixed $value, Closure $fail): void {
                    $msg = ValidationHelper::validateClinicUserIdentification((string) $value);
                    if ($msg !== null) {
                        $fail($msg);
                    }
                },
            ],
            'status'   => ['sometimes', 'boolean'],
        ];
    }
}
