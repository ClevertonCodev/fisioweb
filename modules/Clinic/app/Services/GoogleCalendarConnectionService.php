<?php

namespace Modules\Clinic\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Contracts\Public\ClinicUserGoogleConnectionReadServiceInterface;
use Modules\Clinic\Contracts\Public\GoogleCalendarConnectionWriteServiceInterface;
use Modules\Clinic\Data\Public\GoogleConnectionStateDTO;
use Modules\Clinic\Data\Public\GoogleTokenSetDTO;
use Modules\Clinic\Models\ClinicUser;

class GoogleCalendarConnectionService implements ClinicUserGoogleConnectionReadServiceInterface, GoogleCalendarConnectionWriteServiceInterface
{
    public function isConnected(int $clinicUserId): bool
    {
        $user = ClinicUser::query()->find($clinicUserId);

        return !is_null($user) && $user->isGoogleConnected();
    }

    public function findByAuthenticatedClinicUser(): GoogleConnectionStateDTO
    {
        $user = Auth::guard('clinic')->user();

        return $this->toState($user);
    }

    public function findStateByUserId(int $clinicUserId): ?GoogleConnectionStateDTO
    {
        $user = ClinicUser::query()->find($clinicUserId);

        if (is_null($user)) {
            return null;
        }

        return $this->toState($user);
    }

    public function connectedClinicUserIds(): array
    {
        return ClinicUser::query()
            ->whereNotNull('google_connected_at')
            ->orderBy('id')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    public function storeTokens(int $clinicUserId, GoogleTokenSetDTO $tokens): void
    {
        $user = ClinicUser::query()->findOrFail($clinicUserId);

        $user->forceFill([
            'google_access_token'     => $tokens->accessToken,
            'google_refresh_token'    => $tokens->refreshToken ?? $user->google_refresh_token,
            'google_token_expires_at' => $tokens->expiresAt,
            'google_calendar_id'      => $tokens->calendarId,
            'google_sync_token'       => $tokens->syncToken,
            'google_connected_at'     => $tokens->connectedAt,
        ])->save();
    }

    public function storeSyncToken(int $clinicUserId, ?string $syncToken): void
    {
        ClinicUser::query()
            ->findOrFail($clinicUserId)
            ->forceFill(['google_sync_token' => $syncToken])
            ->save();
    }

    public function clearTokens(int $clinicUserId): void
    {
        ClinicUser::query()
            ->findOrFail($clinicUserId)
            ->forceFill([
                'google_access_token'     => null,
                'google_refresh_token'    => null,
                'google_token_expires_at' => null,
                'google_calendar_id'      => null,
                'google_sync_token'       => null,
                'google_connected_at'     => null,
            ])
            ->save();
    }

    private function toState(ClinicUser $user): GoogleConnectionStateDTO
    {
        return new GoogleConnectionStateDTO(
            clinicUserId: (int) $user->id,
            clinicId: (int) $user->clinic_id,
            connected: $user->isGoogleConnected(),
            accessToken: $user->google_access_token,
            refreshToken: $user->google_refresh_token,
            tokenExpiresAt: $this->immutable($user->google_token_expires_at),
            calendarId: $user->google_calendar_id,
            syncToken: $user->google_sync_token,
            connectedAt: $this->immutable($user->google_connected_at),
        );
    }

    private function immutable($value): ?CarbonImmutable
    {
        if (is_null($value)) {
            return null;
        }

        return CarbonImmutable::parse($value);
    }
}
