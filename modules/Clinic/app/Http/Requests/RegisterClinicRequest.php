<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Support\ReservedClinicSlugs;

class RegisterClinicRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        if (is_string($this->input('email'))) {
            $merge['email'] = mb_strtolower(trim($this->input('email')));
        }

        if (is_string($this->input('slug'))) {
            $merge['slug'] = ReservedClinicSlugs::normalize($this->input('slug'));
        }

        if (is_string($this->input('document'))) {
            $merge['document'] = preg_replace('/\D+/', '', $this->input('document')) ?? '';
        }

        if (is_string($this->input('phone'))) {
            $digits         = preg_replace('/\D+/', '', $this->input('phone')) ?? '';
            $merge['phone'] = !empty($digits) ? $digits : null;
        }

        if (!empty($merge)) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'type_person' => [
                'required',
                'string',
                Rule::in([Clinic::TYPE_PERSON_FISICA, Clinic::TYPE_PERSON_JURIDICA]),
            ],
            'document'    => [
                'required',
                'string',
                'max:30',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (is_string($value) && Clinic::withTrashed()->where('document', $value)->exists()) {
                        $fail('Este documento já está cadastrado.');
                    }
                },
                ReservedClinicSlugs::documentValidationClosure(
                    fn (): string => (string) $this->input('type_person', Clinic::TYPE_PERSON_JURIDICA),
                ),
            ],
            'email'       => [
                'required',
                'string',
                'email',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (!is_string($value)) {
                        return;
                    }
                    // LOWER: e-mails gravados pelo admin guardam a maiúscula digitada.
                    $inClinics = Clinic::withTrashed()->whereRaw('LOWER(email) = ?', [$value])->exists();
                    $inUsers   = ClinicUser::withTrashed()->whereRaw('LOWER(email) = ?', [$value])->exists();

                    if ($inClinics || $inUsers) {
                        $fail('Este e-mail já está em uso.');
                    }
                },
            ],
            'phone'       => ['nullable', 'string', 'regex:/^\d{10,11}$/'],
            'slug'        => [
                'required',
                'string',
                'max:255',
                'regex:' . ReservedClinicSlugs::REGEX,
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (!is_string($value)) {
                        return;
                    }
                    if (ReservedClinicSlugs::isReserved($value)) {
                        $fail('Este endereço é reservado pelo sistema.');

                        return;
                    }
                    if (Clinic::withTrashed()->where('slug', $value)->exists()) {
                        $fail('Este endereço já é de outra clínica.');
                    }
                },
            ],
            'password'       => ['required', 'string', 'min:8', 'confirmed'],
            'terms_accepted' => ['accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'           => 'Informe o nome da clínica.',
            'type_person.required'    => 'Selecione o tipo de pessoa.',
            'type_person.in'          => 'Tipo de pessoa inválido.',
            'document.required'       => 'Informe o CPF ou CNPJ.',
            'email.required'          => 'Informe o e-mail.',
            'email.email'             => 'Informe um e-mail válido.',
            'phone.regex'             => 'Informe um telefone válido com DDD.',
            'slug.required'           => 'Informe o endereço dos links dos pacientes.',
            'slug.regex'              => 'Use apenas letras minúsculas, números e hífens.',
            'password.required'       => 'Informe uma senha.',
            'password.min'            => 'A senha deve ter pelo menos 8 caracteres.',
            'password.confirmed'      => 'A confirmação da senha não confere.',
            'terms_accepted.accepted' => 'Aceite os Termos de Uso e a Política de Privacidade para criar a conta.',
        ];
    }
}
