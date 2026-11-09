<?php

namespace Modules\Clinic\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Clinic\Contracts\ClinicRepositoryInterface;
use Modules\Clinic\Contracts\MasterFirstAccessServiceInterface;
use Modules\Clinic\Data\FirstAccessLinkData;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;

class MasterFirstAccessService implements MasterFirstAccessServiceInterface
{
    public const INVALID_LINK_MESSAGE = 'Link inválido ou já usado. Peça um novo link ao suporte.';

    public function __construct(
        protected ClinicRepositoryInterface $clinicRepository,
    ) {}

    public function generateLink(int $clinicId): FirstAccessLinkData
    {
        $clinic = $this->clinicRepository->findOrFail($clinicId);
        $master = $this->clinicRepository->findMasterUser($clinic->id);

        if (is_null($master) || (int) $master->status !== ClinicUser::STATUS_ACTIVE) {
            abort(422, 'A clínica não tem um usuário mestre ativo.');
        }

        $token     = Str::random(64);
        $createdAt = now();

        $this->clinicRepository->saveClinicUser($master, [
            'first_access_token_hash'       => $this->hash($token),
            'first_access_token_created_at' => $createdAt,
        ]);

        logInfo('link de primeiro acesso do mestre gerado', [
            'clinic_id'      => $clinic->id,
            'clinic_user_id' => $master->id,
        ]);

        return new FirstAccessLinkData(
            url: rtrim((string) config('app.url'), '/') . '/clinica/primeiro-acesso?token=' . $token,
            createdAt: $createdAt,
        );
    }

    public function complete(string $token, string $password): ClinicUser
    {
        $master = DB::transaction(function () use ($token, $password): ClinicUser {
            $master = $this->clinicRepository->findClinicUserByFirstAccessTokenHashForUpdate($this->hash($token));

            if (is_null($master)
                || !$master->isMaster()
                || (int) $master->status !== ClinicUser::STATUS_ACTIVE
                || $master->belongsToCancelledClinic()) {
                abort(422, self::INVALID_LINK_MESSAGE);
            }

            // Quem recebeu o link pelo suporte não tem como confirmar o e-mail de outro jeito.
            $this->clinicRepository->saveClinicUser($master, [
                'password'                      => $password,
                'email_verified_at'             => $master->email_verified_at ?? now(),
                'first_access_token_hash'       => null,
                'first_access_token_created_at' => null,
            ]);

            return $master;
        });

        logInfo('mestre definiu a senha pelo link de primeiro acesso', [
            'clinic_id'      => $master->clinic_id,
            'clinic_user_id' => $master->id,
        ]);

        return $master;
    }

    public function status(Clinic $clinic): array
    {
        $master = $this->clinicRepository->findMasterUser($clinic->id);

        return [
            'master_password_defined'      => !is_null($master?->password_changed_at),
            'first_access_link_created_at' => $master?->first_access_token_created_at?->toIso8601String(),
        ];
    }

    /** O token tem 64 caracteres aleatórios: sha256 basta e permite buscar pelo hash. */
    private function hash(string $token): string
    {
        return hash('sha256', $token);
    }
}
