<?php

namespace Modules\Patient\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'identifier' => ['required', 'string', 'max:255'],
            'password'   => ['required', 'string', 'max:255'],
            // A clínica chega como id (quando o paciente escolheu na lista) ou
            // como slug (quando veio de /{clinicSlug}/paciente/...). Um dos dois
            // basta.
            //
            // Sem `exists:` de propósito: a falha de validação devolveria 422
            // apontando o campo, distinguindo "clínica não existe" de
            // "credencial inválida". Clínica inexistente simplesmente não
            // encontra paciente e cai no 401 genérico.
            'clinic_id'   => ['required_without:clinic_slug', 'nullable', 'integer'],
            'clinic_slug' => ['required_without:clinic_id', 'nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'identifier.required'          => 'Informe seu CPF ou e-mail.',
            'password.required'            => 'Informe sua senha.',
            'clinic_id.required_without'   => 'Selecione a clínica.',
            'clinic_slug.required_without' => 'Selecione a clínica.',
        ];
    }
}
