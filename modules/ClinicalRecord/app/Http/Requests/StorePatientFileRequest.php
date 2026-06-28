<?php

namespace Modules\ClinicalRecord\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:jpeg,png,pdf,docx', 'max:20480'],
            'name' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'O arquivo é obrigatório.',
            'file.file'     => 'O campo deve ser um arquivo válido.',
            'file.mimes'    => 'Tipos permitidos: JPEG, PNG, PDF e DOCX.',
            'file.max'      => 'O arquivo não pode ultrapassar 20 MB.',
        ];
    }
}
