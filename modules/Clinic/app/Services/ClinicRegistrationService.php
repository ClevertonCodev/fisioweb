<?php

namespace Modules\Clinic\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Modules\Admin\Contracts\Public\PlanCatalogReadServiceInterface;
use Modules\Clinic\Contracts\ClinicRegistrationServiceInterface;
use Modules\Clinic\Contracts\ClinicRepositoryInterface;
use Modules\Clinic\Data\RegisterClinicData;
use Modules\Clinic\Jobs\SendClinicEmailVerificationJob;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Notifications\VerifyClinicEmailNotification;
use Modules\Clinic\Support\ReservedClinicSlugs;

class ClinicRegistrationService implements ClinicRegistrationServiceInterface
{
    public const DEFAULT_PLAN_NAME = 'Premium';

    public const VERIFICATION_TTL_SECONDS = 86400; // 24 horas

    public function __construct(
        protected ClinicRepositoryInterface $clinicRepository,
        protected PlanCatalogReadServiceInterface $planCatalog,
    ) {}

    public function checkSlugAvailability(?string $slug): array
    {
        $normalized = ReservedClinicSlugs::normalize($slug);

        if (!ReservedClinicSlugs::isValidFormat($normalized)) {
            return ['available' => false, 'reason' => 'invalid'];
        }

        if (ReservedClinicSlugs::isReserved($normalized)) {
            return ['available' => false, 'reason' => 'reserved'];
        }

        if ($this->clinicRepository->slugExistsWithTrashed($normalized)) {
            return ['available' => false, 'reason' => 'taken'];
        }

        return ['available' => true, 'reason' => null];
    }

    public function register(RegisterClinicData $data): array
    {
        return DB::transaction(function () use ($data): array {
            $planId          = $this->planCatalog->findPlanIdByName(self::DEFAULT_PLAN_NAME);
            $termsAcceptedAt = $data->termsAccepted ? now() : null;

            $clinic = $this->clinicRepository->createWithoutMasterUserObserver([
                'name'              => $data->name,
                'type_person'       => $data->typePerson,
                'document'          => $data->document,
                'email'             => $data->email,
                'phone'             => $data->phone,
                'slug'              => $data->slug,
                'status'            => Clinic::STATUS_ACTIVE,
                'plan_id'           => $planId,
                'terms_accepted_at' => $termsAcceptedAt,
            ]);

            $master = $this->clinicRepository->createMasterUser([
                'clinic_id'           => $clinic->id,
                'name'                => $data->name,
                'email'               => $data->email,
                'email_verified_at'   => null,
                'terms_accepted_at'   => $termsAcceptedAt,
                'password'            => Hash::make($data->password),
                'password_changed_at' => now(),
                'document'            => $data->document,
                'role'                => ClinicUser::ROLE_ADMIN,
                'mestre'              => ClinicUser::MESTRE_YES,
                'status'              => ClinicUser::STATUS_ACTIVE,
            ]);

            SendClinicEmailVerificationJob::dispatch(clinicUserId: (int) $master->id)->afterCommit();

            logInfo('auto-cadastro da clínica concluído', [
                'clinic_id'      => $clinic->id,
                'clinic_user_id' => $master->id,
            ]);

            return [
                'clinic' => $clinic,
                'master' => $master,
            ];
        });
    }

    public function buildSignedVerificationUrl(ClinicUser $user, ?int $expiresAt = null): string
    {
        $expires   = $expiresAt ?? now()->addSeconds(self::VERIFICATION_TTL_SECONDS)->getTimestamp();
        $hash      = sha1(mb_strtolower($user->email));
        $signature = $this->signPayload((int) $user->id, $hash, $expires);

        $query = http_build_query([
            'id'        => (int) $user->id,
            'hash'      => $hash,
            'expires'   => $expires,
            'signature' => $signature,
        ]);

        return rtrim((string) config('app.url'), '/') . '/clinica/confirmar-email?' . $query;
    }

    public function sendVerificationNotification(int $clinicUserId): void
    {
        $user = $this->clinicRepository->findClinicUserWithClinic($clinicUserId);

        if (is_null($user) || !is_null($user->email_verified_at)) {
            return;
        }

        $url        = $this->buildSignedVerificationUrl($user);
        $clinicName = $user->clinic?->name ?? $user->name;

        $user->notify(new VerifyClinicEmailNotification(
            verificationUrl: $url,
            clinicName: $clinicName,
        ));
    }

    public function verifyEmail(int $userId, string $hash, int $expires, string $signature): bool
    {
        if ($expires < now()->getTimestamp()) {
            return false;
        }

        $expectedSignature = $this->signPayload($userId, $hash, $expires);

        if (!hash_equals($expectedSignature, $signature)) {
            return false;
        }

        $user = $this->clinicRepository->findClinicUserWithClinic($userId);

        if (is_null($user)) {
            return false;
        }

        $expectedHash = sha1(mb_strtolower($user->email));

        if (!hash_equals($expectedHash, strtolower($hash))) {
            return false;
        }

        if (is_null($user->email_verified_at)) {
            $this->clinicRepository->markClinicUserEmailVerified($user);

            logInfo('e-mail da clínica confirmado', [
                'clinic_id'      => $user->clinic_id,
                'clinic_user_id' => $user->id,
            ]);
        }

        return true;
    }

    public function resendVerification(string $email): void
    {
        $user = $this->clinicRepository->findActiveUnverifiedUserByEmail($email);

        if (is_null($user)) {
            return;
        }

        SendClinicEmailVerificationJob::dispatch(clinicUserId: (int) $user->id)->afterCommit();
    }

    protected function signPayload(int $userId, string $hash, int $expires): string
    {
        $payload = "clinic-verify-email|{$userId}|{$hash}|{$expires}";

        return hash_hmac('sha256', $payload, (string) config('app.key'));
    }
}
