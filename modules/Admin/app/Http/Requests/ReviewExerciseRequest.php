<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewExerciseRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Autorização garantida pelo middleware auth:admin no grupo de rotas.
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
