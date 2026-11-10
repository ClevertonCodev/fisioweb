<?php

namespace Modules\GoogleCalendar\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompleteGoogleConnectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'ticket' => ['required', 'string', 'max:128'],
        ];
    }
}
