<?php

namespace Modules\Clinic\Data;

final readonly class RegisterClinicData
{
    public function __construct(
        public string $name,
        public string $typePerson,
        public string $document,
        public string $email,
        public ?string $phone,
        public string $slug,
        public string $password,
        public bool $termsAccepted = true,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated): self
    {
        $rawPhone = isset($validated['phone']) && is_string($validated['phone'])
            ? (preg_replace('/\D+/', '', $validated['phone']) ?? '')
            : '';

        return new self(
            name: trim((string) $validated['name']),
            typePerson: (string) $validated['type_person'],
            document: preg_replace('/\D+/', '', (string) $validated['document']) ?? '',
            email: mb_strtolower(trim((string) $validated['email'])),
            phone: !empty($rawPhone) ? $rawPhone : null,
            slug: mb_strtolower(trim((string) $validated['slug'])),
            password: (string) $validated['password'],
            termsAccepted: (bool) ($validated['terms_accepted'] ?? true),
        );
    }
}
