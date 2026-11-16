<?php

namespace Modules\Clinic\Contracts;

use Illuminate\Support\Collection;
use Modules\Clinic\Models\ClinicUser;

interface ClinicUserServiceInterface
{
    public function listForClinic(int $clinicId): Collection;

    public function create(array $data, int $clinicId): ClinicUser;

    public function update(ClinicUser $clinicUser, array $data, bool $impersonating): ClinicUser;

    public function delete(ClinicUser $clinicUser): void;
}
