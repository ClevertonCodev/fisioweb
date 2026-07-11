<?php

namespace Modules\Clinic\Contracts\Public;

use Modules\Clinic\Data\Public\GoogleConnectionStateDTO;

interface ClinicUserGoogleConnectionReadServiceInterface
{
    public function isConnected(int $clinicUserId): bool;

    public function findByAuthenticatedClinicUser(): GoogleConnectionStateDTO;

    public function findStateByUserId(int $clinicUserId): ?GoogleConnectionStateDTO;

    /**
     * @return array<int>
     */
    public function connectedClinicUserIds(): array;
}
