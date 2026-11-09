<?php

namespace Modules\Clinic\Data;

use Modules\Clinic\Models\ClinicUser;

final readonly class ImpersonationSession
{
    public function __construct(
        public ClinicUser $clinicUser,
        public string $token,
    ) {}
}
