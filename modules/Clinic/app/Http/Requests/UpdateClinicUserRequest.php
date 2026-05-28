<?php

namespace Modules\Clinic\Http\Requests;

use App\Helpers\ValidationHelper;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Clinic\Models\ClinicUser;

class UpdateClinicUserRequest extends FormRequest
{
    public function rules(): array
    {
        $userId = $this->route('user')?->id ?? $this->route('user');

        return [
            'name'     => ['sometimes', 'string', 'max:255'],
            'email'    => ['sometimes', 'email', Rule::unique('clinic_users', 'email')->ignore($userId)],
            'password' => ['sometimes', 'string', 'min:8'],
            'role'     => ['sometimes', 'string', 'in:' . implode(',', array_keys(ClinicUser::ROLES))],
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
