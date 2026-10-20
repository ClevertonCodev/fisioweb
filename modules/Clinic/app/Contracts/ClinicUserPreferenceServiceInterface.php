<?php

namespace Modules\Clinic\Contracts;

use Modules\Clinic\Enums\ClinicUserPreferenceKey;
use Modules\Clinic\Models\ClinicUser;

interface ClinicUserPreferenceServiceInterface
{
    /**
     * @param  list<ClinicUserPreferenceKey>  $keys
     * @return array<string, mixed>
     */
    public function get(ClinicUser $user, array $keys): array;

    public function set(ClinicUser $user, ClinicUserPreferenceKey $key, mixed $value): mixed;
}
