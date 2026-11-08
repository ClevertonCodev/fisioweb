<?php

namespace Modules\Clinic\Contracts;

use Modules\Clinic\Data\FirstAccessLinkData;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;

interface MasterFirstAccessServiceInterface
{
    /**
     * Gera o link de uso único do mestre e invalida o anterior. Serve também
     * de "link de nova senha" quando o mestre já tem senha.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException 422 sem mestre ativo
     */
    public function generateLink(int $clinicId): FirstAccessLinkData;

    /**
     * Define a senha do mestre dono do token e consome o link.
     *
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException 422 com token inválido, usado ou trocado
     */
    public function complete(string $token, string $password): ClinicUser;

    /**
     * @return array{master_password_defined: bool, first_access_link_created_at: string|null}
     */
    public function status(Clinic $clinic): array;
}
