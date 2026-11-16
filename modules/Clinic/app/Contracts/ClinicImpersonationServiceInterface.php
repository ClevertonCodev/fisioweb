<?php

namespace Modules\Clinic\Contracts;

use Closure;
use Modules\Clinic\Data\ImpersonationSession;
use Modules\Clinic\Models\ClinicUser;

interface ClinicImpersonationServiceInterface
{
    /**
     * Só quem chama tem acesso ao guard da clínica, então emite o token; o
     * registro só é gravado depois que o token existe.
     *
     * @param  Closure(ClinicUser, array<string, mixed>): string  $issueToken  recebe o usuário e as claims do token
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException clínica inexistente
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException 422 com clínica cancelada ou sem administrador ativo
     */
    public function impersonate(int $clinicId, int $operatorId, ?string $ip, ?string $userAgent, Closure $issueToken): ImpersonationSession;

    /**
     * @return list<array{operator_name: string, clinic_user_name: ?string, created_at: string}>
     */
    public function recentLoginAs(int $clinicId): array;
}
