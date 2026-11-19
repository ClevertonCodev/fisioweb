<?php

namespace Modules\Clinic\Data\Public;

final readonly class ClinicProfessionalDTO
{
    public function __construct(
        public int $id,
        public int $clinicId,
        public string $name,
        public string $role,
        public string $roleLabel,
    ) {}
}
