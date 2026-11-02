<?php

namespace Modules\Clinic\Contracts;

use Modules\Clinic\Data\RegisterClinicData;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;

interface ClinicRegistrationServiceInterface
{
    /**
     * @return array{available: bool, reason: string|null}
     */
    public function checkSlugAvailability(?string $slug): array;

    /**
     * @return array{clinic: Clinic, master: ClinicUser}
     */
    public function register(RegisterClinicData $data): array;

    public function buildSignedVerificationUrl(ClinicUser $user, ?int $expiresAt = null): string;

    public function sendVerificationNotification(int $clinicUserId): void;

    public function verifyEmail(int $userId, string $hash, int $expires, string $signature): bool;

    public function resendVerification(string $email): void;
}
