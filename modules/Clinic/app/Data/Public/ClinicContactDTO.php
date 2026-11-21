<?php

namespace Modules\Clinic\Data\Public;

final readonly class ClinicContactDTO
{
    public function __construct(
        public int $id,
        public string $name,
        public ?string $phone,
        public ?string $address,
        public ?string $number,
        public ?string $city,
        public ?string $state,
        public string $timezone,
        public bool $appointmentReminderEmailEnabled,
        public bool $cancelled,
    ) {}

    public function formattedAddress(): ?string
    {
        $parts = [];

        if (!empty($this->address)) {
            $street  = $this->address . (!empty($this->number) ? ', ' . $this->number : '');
            $parts[] = $street;
        }

        if (!empty($this->city) && !empty($this->state)) {
            $parts[] = "{$this->city}/{$this->state}";
        } elseif (!empty($this->city)) {
            $parts[] = $this->city;
        } elseif (!empty($this->state)) {
            $parts[] = $this->state;
        }

        return empty($parts) ? null : implode(' · ', $parts);
    }
}
