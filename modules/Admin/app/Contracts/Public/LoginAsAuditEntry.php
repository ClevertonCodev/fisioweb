<?php

namespace Modules\Admin\Contracts\Public;

final readonly class LoginAsAuditEntry
{
    public function __construct(
        public int $adminUserId,
        public int $clinicId,
        public int $clinicUserId,
        public ?string $ip,
        public ?string $userAgent,
    ) {}
}
