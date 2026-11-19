<?php

namespace Modules\Patient\Data\Public;

final readonly class PatientContactDTO
{
    public function __construct(
        public int $id,
        public int $clinicId,
        public string $name,
        public ?string $apelido,
        public bool $useApelido,
        public ?string $email,
        public ?string $phone,
        public bool $receivesAppointmentReminderEmail,
    ) {}

    public function greetingName(): string
    {
        if ($this->useApelido && !empty(trim((string) $this->apelido))) {
            return trim((string) $this->apelido);
        }

        $trimmed = trim($this->name);
        if (empty($trimmed)) {
            return '';
        }

        $parts = preg_split('/\s+/u', $trimmed);

        return $parts[0] ?? $trimmed;
    }
}
